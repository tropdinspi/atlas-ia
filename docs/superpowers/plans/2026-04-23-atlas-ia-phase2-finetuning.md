# Atlas-IA Phase 2 — Plan Fine-tuning + WebLLM

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fine-tuner Llama 3.2 3B sur les données d'orientation françaises, le convertir en GGUF Q4, et migrer l'app Next.js pour faire tourner le modèle entièrement dans le navigateur via WebLLM.

**Architecture:** Pipeline Python local (WSL2 + Unsloth + RTX 3070 Ti) pour construire le dataset et entraîner le modèle. Conversion GGUF via llama.cpp. Migration de l'app : remplacement de l'API Groq par WebLLM (@mlc-ai/web-llm) + RAG browser-side avec Transformers.js et IndexedDB.

**Tech Stack:** Python 3.12, Conda, Unsloth, Hugging Face CLI, llama.cpp, @mlc-ai/web-llm, @xenova/transformers, Next.js 15.

**Prérequis :** Phase 1 MVP validée et déployée. Au moins 500 conversations réelles collectées.

---

## Structure des fichiers

```
pipeline/                         ← dossier Python (hors Next.js)
├── environment.yml               ← Conda env
├── 1_collecter_dataset.py        ← nettoyage conversations Phase 1
├── 2_scraper_onisep.py           ← transformation ONISEP → JSONL
├── 3_traiter_rome.py             ← transformation ROME → JSONL
├── 4_generer_riasec.py           ← Q/R RIASEC → JSONL
├── 5_fusionner_dataset.py        ← fusion + validation finale
├── 6_finetuner.py                ← entraînement Unsloth
├── 7_evaluer.py                  ← évaluation qualité modèle
├── 8_convertir_gguf.py           ← conversion llama.cpp
└── data/
    ├── raw/                      ← données brutes ONISEP/ROME
    ├── processed/                ← JSONL nettoyés par source
    └── final/
        └── atlas-ia-dataset.jsonl

src/                              ← app Next.js (Phase 2 migration)
├── lib/
│   ├── webllm-client.ts          ← wrapper WebLLM (remplace groq-client)
│   ├── embeddings.ts             ← Transformers.js (vecteurs)
│   ├── vector-store.ts           ← IndexedDB (stockage + recherche)
│   └── rag-browser.ts           ← RAG complet côté navigateur
├── hooks/
│   └── useWebLLM.ts              ← hook React pour WebLLM
└── components/
    └── chat/
        └── ModelLoader.tsx       ← barre de progression téléchargement modèle
```

---

## Task 1 : Setup environnement Python (WSL2 + Conda + CUDA)

**Files:**
- Create: `pipeline/environment.yml`

- [ ] **Étape 1 : Vérifier que WSL2 est installé**

Dans PowerShell (en admin) :
```powershell
wsl --install
wsl --set-default-version 2
```

Si déjà installé, vérifier la version :
```powershell
wsl -l -v
```
Attendu : Ubuntu avec VERSION = 2

- [ ] **Étape 2 : Installer les drivers NVIDIA dans WSL2**

Dans WSL2 (terminal Ubuntu) :
```bash
nvidia-smi
```
Attendu : affiche ta RTX 3070 Ti avec ~8000 MiB VRAM. Si erreur → mettre à jour les drivers NVIDIA Windows depuis nvidia.com (les drivers Windows incluent le support CUDA pour WSL2).

- [ ] **Étape 3 : Installer Miniconda dans WSL2**

```bash
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash Miniconda3-latest-Linux-x86_64.sh -b -p $HOME/miniconda3
echo 'export PATH="$HOME/miniconda3/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
conda --version
```
Attendu : `conda 24.x.x`

- [ ] **Étape 4 : Créer `pipeline/environment.yml`**

```yaml
name: atlas-ia
channels:
  - pytorch
  - nvidia
  - conda-forge
  - defaults
dependencies:
  - python=3.12
  - pip
  - pip:
    - torch==2.4.0+cu121 --index-url https://download.pytorch.org/whl/cu121
    - unsloth[colab-new]
    - transformers
    - datasets
    - huggingface_hub
    - trl
    - peft
    - jsonlines
    - tqdm
```

- [ ] **Étape 5 : Créer l'environnement Conda**

```bash
cd /mnt/c/Users/matia/source/repos/mon\ ia/pipeline
conda env create -f environment.yml
conda activate atlas-ia
python -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0))"
```
Attendu : `True NVIDIA GeForce RTX 3070 Ti`

- [ ] **Étape 6 : Se connecter à Hugging Face**

```bash
huggingface-cli login
```
Entrer ton token depuis https://huggingface.co/settings/tokens (token avec accès "write")

- [ ] **Étape 7 : Accepter la licence Llama 3.2**

Aller sur https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct et cliquer "Accept license".

- [ ] **Étape 8 : Télécharger le modèle de base**

```bash
huggingface-cli download meta-llama/Llama-3.2-3B-Instruct \
  --local-dir ./models/llama-3.2-3b-instruct \
  --include "*.safetensors" "*.json" "tokenizer*"
```
Attendu : ~6 Go téléchargés dans `pipeline/models/llama-3.2-3b-instruct/`

- [ ] **Étape 9 : Commit**

```bash
git add pipeline/environment.yml
git commit -m "feat: setup environnement Python fine-tuning"
```

---

## Task 2 : Script de collecte et nettoyage du dataset Phase 1

**Files:**
- Create: `pipeline/1_collecter_dataset.py`

- [ ] **Étape 1 : Créer `pipeline/1_collecter_dataset.py`**

Ce script prend des conversations collectées manuellement (JSON) et les transforme en JSONL propre :

```python
"""
Transforme les conversations Phase 1 collectées en exemples JSONL
pour le fine-tuning.

Format entrée (conversations_phase1.json) :
[
  {"question": "...", "reponse": "...", "qualite": 5}
]

Format sortie (processed/conversations.jsonl) :
{"instruction": "...", "input": "", "output": "..."}
"""

import json
import hashlib
import re
from pathlib import Path

ENTREE = Path("data/raw/conversations_phase1.json")
SORTIE = Path("data/processed/conversations.jsonl")
QUALITE_MIN = 4  # garder uniquement les notes >= 4/5

MOTS_INTERDITS = [
    "je ne sais pas",
    "je ne suis pas sûr",
    "il m'est impossible",
    "en tant qu'ia",
    "en tant qu'intelligence artificielle",
]

def est_valide(question: str, reponse: str) -> bool:
    if len(question.strip()) < 10:
        return False
    if len(reponse.strip()) < 50 or len(reponse.strip()) > 2000:
        return False
    reponse_lower = reponse.lower()
    if any(mot in reponse_lower for mot in MOTS_INTERDITS):
        return False
    return True

def nettoyer_texte(texte: str) -> str:
    texte = texte.strip()
    texte = re.sub(r'\n{3,}', '\n\n', texte)
    return texte

def main():
    if not ENTREE.exists():
        print(f"Fichier {ENTREE} introuvable. Crée d'abord conversations_phase1.json")
        return

    with open(ENTREE, encoding="utf-8") as f:
        conversations = json.load(f)

    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    vus = set()
    compteur = 0

    with open(SORTIE, "w", encoding="utf-8") as f:
        for conv in conversations:
            if conv.get("qualite", 0) < QUALITE_MIN:
                continue

            question = nettoyer_texte(conv["question"])
            reponse = nettoyer_texte(conv["reponse"])

            if not est_valide(question, reponse):
                continue

            # dédoublonnage par hash de la question
            h = hashlib.sha256(question.encode()).hexdigest()
            if h in vus:
                continue
            vus.add(h)

            exemple = {"instruction": question, "input": "", "output": reponse}
            f.write(json.dumps(exemple, ensure_ascii=False) + "\n")
            compteur += 1

    print(f"✓ {compteur} exemples valides écrits dans {SORTIE}")

if __name__ == "__main__":
    main()
```

- [ ] **Étape 2 : Créer un fichier de test minimal**

Créer `pipeline/data/raw/conversations_phase1.json` :

```json
[
  {
    "question": "Quelles études pour devenir infirmier ?",
    "reponse": "Pour devenir infirmier, tu dois obtenir le Diplôme d'État Infirmier (DEI), une formation de 3 ans accessible après le bac. L'entrée se fait via Parcoursup (filière IFSI). Le salaire débutant est d'environ 1 800€ net/mois.",
    "qualite": 5
  }
]
```

- [ ] **Étape 3 : Lancer le script**

```bash
conda activate atlas-ia
cd pipeline
python 1_collecter_dataset.py
```
Attendu : `✓ 1 exemples valides écrits dans data/processed/conversations.jsonl`

- [ ] **Étape 4 : Commit**

```bash
git add pipeline/1_collecter_dataset.py
git commit -m "feat: script nettoyage dataset Phase 1"
```

---

## Task 3 : Transformation ONISEP → JSONL

**Files:**
- Create: `pipeline/2_scraper_onisep.py`

- [ ] **Étape 1 : Télécharger les données ONISEP**

Aller sur https://data.onisep.fr/datasets et télécharger :
- "Fiches métiers" en format CSV ou JSON
- Sauvegarder dans `pipeline/data/raw/onisep_metiers.json`

- [ ] **Étape 2 : Créer `pipeline/2_scraper_onisep.py`**

```python
"""
Transforme les fiches métiers ONISEP en paires Q/R pour le fine-tuning.
Génère plusieurs questions par fiche pour enrichir le dataset.
"""

import json
from pathlib import Path

ENTREE = Path("data/raw/onisep_metiers.json")
SORTIE = Path("data/processed/onisep.jsonl")

def generer_paires(metier: dict) -> list[dict]:
    """Génère plusieurs paires Q/R depuis une fiche métier."""
    nom = metier.get("intitule", "")
    description = metier.get("description", "")
    acces = metier.get("acces_metier", "")
    salaire = metier.get("salaire", "Non renseigné")

    if not nom or not description:
        return []

    paires = [
        {
            "instruction": f"C'est quoi le métier de {nom} ?",
            "input": "",
            "output": f"{description}"
        },
        {
            "instruction": f"Quelles études pour devenir {nom} ?",
            "input": "",
            "output": f"Pour devenir {nom}, voici le parcours : {acces}"
            if acces else f"Pour devenir {nom} : {description}"
        },
    ]

    if salaire and salaire != "Non renseigné":
        paires.append({
            "instruction": f"Quel est le salaire d'un {nom} ?",
            "input": "",
            "output": f"Le salaire d'un {nom} : {salaire}"
        })

    return paires

def main():
    if not ENTREE.exists():
        print(f"Télécharge d'abord les données ONISEP dans {ENTREE}")
        return

    with open(ENTREE, encoding="utf-8") as f:
        metiers = json.load(f)

    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    compteur = 0

    with open(SORTIE, "w", encoding="utf-8") as f:
        for metier in metiers:
            for paire in generer_paires(metier):
                f.write(json.dumps(paire, ensure_ascii=False) + "\n")
                compteur += 1

    print(f"✓ {compteur} paires Q/R générées depuis ONISEP → {SORTIE}")

if __name__ == "__main__":
    main()
```

- [ ] **Étape 3 : Lancer le script une fois les données ONISEP téléchargées**

```bash
python 2_scraper_onisep.py
```
Attendu : 1 500+ paires Q/R (800 métiers × ~2 questions minimum)

- [ ] **Étape 4 : Commit**

```bash
git add pipeline/2_scraper_onisep.py
git commit -m "feat: transformation ONISEP vers JSONL"
```

---

## Task 4 : Transformation ROME + questions RIASEC → JSONL

**Files:**
- Create: `pipeline/3_traiter_rome.py`, `pipeline/4_generer_riasec.py`

- [ ] **Étape 1 : Télécharger les données ROME**

Aller sur https://francetravail.io/opendata et télécharger le fichier ROME v4 (format XML ou JSON).
Sauvegarder dans `pipeline/data/raw/rome_v4.json`

- [ ] **Étape 2 : Créer `pipeline/3_traiter_rome.py`**

```python
"""
Transforme les fiches ROME v4 (France Travail) en paires Q/R.
Focus sur : compétences, débouchés, salaires, reconversion.
"""

import json
from pathlib import Path

ENTREE = Path("data/raw/rome_v4.json")
SORTIE = Path("data/processed/rome.jsonl")

def generer_paires_rome(fiche: dict) -> list[dict]:
    code = fiche.get("code", "")
    libelle = fiche.get("libelle", "")
    definition = fiche.get("definition", "")
    competences = fiche.get("competences", [])
    acces = fiche.get("acces_emploi_metier", "")

    if not libelle or not definition:
        return []

    comp_texte = ", ".join(c.get("libelle", "") for c in competences[:6]) if competences else ""

    paires = [
        {
            "instruction": f"Quelles compétences faut-il pour être {libelle} ?",
            "input": "",
            "output": f"Pour exercer le métier de {libelle} (code ROME {code}), "
                      f"les compétences clés sont : {comp_texte}. {definition}"
        }
    ]

    if acces:
        paires.append({
            "instruction": f"Comment accéder au métier de {libelle} ?",
            "input": "",
            "output": f"Voici comment accéder au métier de {libelle} : {acces}"
        })

    return paires

def main():
    if not ENTREE.exists():
        print(f"Télécharge d'abord les données ROME dans {ENTREE}")
        return

    with open(ENTREE, encoding="utf-8") as f:
        fiches = json.load(f)

    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    compteur = 0

    with open(SORTIE, "w", encoding="utf-8") as f:
        for fiche in fiches:
            for paire in generer_paires_rome(fiche):
                f.write(json.dumps(paire, ensure_ascii=False) + "\n")
                compteur += 1

    print(f"✓ {compteur} paires Q/R générées depuis ROME → {SORTIE}")

if __name__ == "__main__":
    main()
```

- [ ] **Étape 3 : Créer `pipeline/4_generer_riasec.py`**

```python
"""
Génère des paires Q/R autour du quiz RIASEC et des profils Holland.
Ces données apprennent à l'IA à expliquer et interpréter le RIASEC.
"""

import json
from pathlib import Path

SORTIE = Path("data/processed/riasec.jsonl")

PROFILS = [
    {
        "type": "R", "label": "Réaliste",
        "description": "profil technique et manuel, qui préfère le travail concret",
        "metiers": ["électricien", "mécanicien", "infirmier urgences", "charpentier", "pilote"],
        "etudes": "formations techniques (CAP, Bac Pro, BTS techniques, IUT génie civil)"
    },
    {
        "type": "I", "label": "Investigateur",
        "description": "profil analytique et scientifique, qui aime résoudre des problèmes complexes",
        "metiers": ["médecin", "data scientist", "ingénieur", "chercheur", "pharmacien"],
        "etudes": "formations scientifiques longues (PASS, Classes prépa, Master sciences)"
    },
    {
        "type": "A", "label": "Artistique",
        "description": "profil créatif et expressif, qui a besoin de liberté dans son travail",
        "metiers": ["graphiste", "architecte", "journaliste", "designer UX", "photographe"],
        "etudes": "écoles d'art et de design, BTS communication visuelle, DN MADE"
    },
    {
        "type": "S", "label": "Social",
        "description": "profil humain et communicant, qui s'épanouit en aidant les autres",
        "metiers": ["infirmier", "enseignant", "psychologue", "éducateur spécialisé", "kinésithérapeute"],
        "etudes": "formations sociales et de santé (IFSI, MEEF, DEES, master psychologie)"
    },
    {
        "type": "E", "label": "Entrepreneur",
        "description": "profil leader et ambitieux, qui aime diriger et convaincre",
        "metiers": ["commercial", "chef de projet", "avocat", "directeur marketing", "entrepreneur"],
        "etudes": "écoles de commerce, master management, droit"
    },
    {
        "type": "C", "label": "Conventionnel",
        "description": "profil organisé et précis, qui aime les environnements structurés",
        "metiers": ["comptable", "contrôleur de gestion", "analyste financier", "gestionnaire RH"],
        "etudes": "BTS CG, IUT GEA, licence économie-gestion, master finance"
    },
]

PAIRES_STATIQUES = [
    {
        "instruction": "C'est quoi le test RIASEC ?",
        "input": "",
        "output": "Le test RIASEC (ou modèle Holland) est le questionnaire d'orientation professionnelle le plus utilisé au monde. Il identifie ta personnalité professionnelle selon 6 types : Réaliste (R), Investigateur (I), Artistique (A), Social (S), Entrepreneur (E) et Conventionnel (C). Ton profil est généralement une combinaison de 2-3 types dominants, qui correspond à des familles de métiers précises."
    },
    {
        "instruction": "Comment fonctionne le quiz d'orientation ?",
        "input": "",
        "output": "Notre quiz comporte 30 questions (5 par type RIASEC). Pour chaque question, tu indiques si cette activité te correspond de 1 (pas du tout) à 5 (tout à fait). À la fin, tu obtiens ton profil dominant (ex: SAI = Social-Artistique-Investigateur) et une liste de métiers qui correspondent à ta personnalité."
    },
    {
        "instruction": "Mon profil RIASEC est SE, quels métiers me correspondent ?",
        "input": "",
        "output": "Le profil SE (Social-Entrepreneur) correspond à des personnes qui aiment à la fois aider les autres ET diriger, convaincre. Les métiers idéaux sont : conseiller en orientation, responsable RH, directeur d'établissement scolaire, chef de projet social, formateur indépendant, ou encore consultant en ressources humaines."
    },
]

def main():
    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    compteur = 0

    with open(SORTIE, "w", encoding="utf-8") as f:
        # Paires statiques
        for paire in PAIRES_STATIQUES:
            f.write(json.dumps(paire, ensure_ascii=False) + "\n")
            compteur += 1

        # Paires générées par profil
        for p in PROFILS:
            metiers_str = ", ".join(p["metiers"])
            paires = [
                {
                    "instruction": f"Je suis de type {p['type']} ({p['label']}), quels métiers me conviennent ?",
                    "input": "",
                    "output": f"Le profil {p['label']} ({p['type']}) est un {p['description']}. "
                              f"Les métiers qui correspondent le mieux : {metiers_str}. "
                              f"Côté études : {p['etudes']}."
                },
                {
                    "instruction": f"C'est quoi le profil {p['label']} dans le RIASEC ?",
                    "input": "",
                    "output": f"Le type {p['label']} ({p['type']}) du modèle RIASEC désigne un {p['description']}. "
                              f"Les métiers typiques de ce profil sont : {metiers_str}."
                },
            ]
            for paire in paires:
                f.write(json.dumps(paire, ensure_ascii=False) + "\n")
                compteur += 1

    print(f"✓ {compteur} paires Q/R RIASEC générées → {SORTIE}")

if __name__ == "__main__":
    main()
```

- [ ] **Étape 4 : Lancer les deux scripts**

```bash
python 3_traiter_rome.py
python 4_generer_riasec.py
```

- [ ] **Étape 5 : Commit**

```bash
git add pipeline/3_traiter_rome.py pipeline/4_generer_riasec.py
git commit -m "feat: transformation ROME et génération Q/R RIASEC"
```

---

## Task 5 : Fusion + validation du dataset final

**Files:**
- Create: `pipeline/5_fusionner_dataset.py`

- [ ] **Étape 1 : Créer `pipeline/5_fusionner_dataset.py`**

```python
"""
Fusionne tous les fichiers JSONL et valide la qualité du dataset final.
Objectif : 5 000 exemples propres et dédoublonnés.
"""

import json
import hashlib
from pathlib import Path
from collections import Counter

SOURCES = [
    Path("data/processed/conversations.jsonl"),
    Path("data/processed/onisep.jsonl"),
    Path("data/processed/rome.jsonl"),
    Path("data/processed/riasec.jsonl"),
]
SORTIE = Path("data/final/atlas-ia-dataset.jsonl")

def valider_exemple(ex: dict) -> tuple[bool, str]:
    instruction = ex.get("instruction", "")
    output = ex.get("output", "")

    if len(instruction) < 10:
        return False, "instruction trop courte"
    if len(output) < 50:
        return False, "output trop court"
    if len(output) > 3000:
        return False, "output trop long"

    mots_interdits = ["je ne sais pas", "je suis désolé, je ne peux pas", "en tant qu'ia"]
    if any(m in output.lower() for m in mots_interdits):
        return False, "output contient formule interdite"

    return True, "ok"

def main():
    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    vus = set()
    compteur_total = 0
    compteur_rejets = 0
    rejets_par_raison: Counter = Counter()

    with open(SORTIE, "w", encoding="utf-8") as sortie_f:
        for source in SOURCES:
            if not source.exists():
                print(f"⚠️  {source} introuvable — ignoré")
                continue

            compteur_source = 0
            with open(source, encoding="utf-8") as f:
                for ligne in f:
                    try:
                        ex = json.loads(ligne.strip())
                    except json.JSONDecodeError:
                        continue

                    valide, raison = valider_exemple(ex)
                    if not valide:
                        compteur_rejets += 1
                        rejets_par_raison[raison] += 1
                        continue

                    h = hashlib.sha256(ex["instruction"].encode()).hexdigest()
                    if h in vus:
                        compteur_rejets += 1
                        rejets_par_raison["doublon"] += 1
                        continue
                    vus.add(h)

                    sortie_f.write(json.dumps(ex, ensure_ascii=False) + "\n")
                    compteur_total += 1
                    compteur_source += 1

            print(f"✓ {source.name} : {compteur_source} exemples retenus")

    print(f"\n{'='*40}")
    print(f"Dataset final : {compteur_total} exemples")
    print(f"Exemples rejetés : {compteur_rejets}")
    print(f"Rejets par raison : {dict(rejets_par_raison)}")

    if compteur_total < 2000:
        print("\n⚠️  Moins de 2 000 exemples — le fine-tuning sera de qualité limitée.")
        print("   Ajoute plus de données ONISEP/ROME ou attends plus de conversations Phase 1.")
    elif compteur_total >= 5000:
        print("\n✅ Dataset suffisant pour un bon fine-tuning.")

if __name__ == "__main__":
    main()
```

- [ ] **Étape 2 : Lancer la fusion**

```bash
python 5_fusionner_dataset.py
```

Attendu :
```
✓ conversations.jsonl : X exemples retenus
✓ onisep.jsonl : X exemples retenus
...
Dataset final : XXXX exemples
```

- [ ] **Étape 3 : Commit**

```bash
git add pipeline/5_fusionner_dataset.py
git commit -m "feat: fusion et validation dataset final"
```

---

## Task 6 : Fine-tuning avec Unsloth

**Files:**
- Create: `pipeline/6_finetuner.py`

- [ ] **Étape 1 : Créer `pipeline/6_finetuner.py`**

```python
"""
Fine-tuning de Llama 3.2 3B avec Unsloth + LoRA.
Utilise ~4 Go de VRAM sur RTX 3070 Ti.
Durée estimée : 2-3h pour 5 000 exemples.
"""

from unsloth import FastLanguageModel
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments
import torch

MODELE_BASE = "./models/llama-3.2-3b-instruct"
DATASET_PATH = "./data/final/atlas-ia-dataset.jsonl"
SORTIE_MODELE = "./models/atlas-ia-lora"
MODELE_FUSIONNE = "./models/atlas-ia-merged"

# --- Chargement du modèle avec Unsloth ---
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=MODELE_BASE,
    max_seq_length=2048,
    dtype=None,        # auto-détection (float16 sur 3070 Ti)
    load_in_4bit=True, # quantisation 4-bit = ~4 Go VRAM
)

# --- Configuration LoRA (entraîne ~1% des paramètres) ---
model = FastLanguageModel.get_peft_model(
    model,
    r=16,                          # rang LoRA (16 = bon compromis qualité/vitesse)
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    lora_alpha=16,
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=42,
)

# --- Chargement du dataset ---
dataset = load_dataset("json", data_files=DATASET_PATH, split="train")

def formater_exemple(exemples):
    """Formate en prompt Llama 3 Instruct."""
    textes = []
    for instruction, output in zip(exemples["instruction"], exemples["output"]):
        texte = (
            f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n"
            f"Tu es Atlas-IA, un conseiller d'orientation professionnelle français expert et bienveillant. "
            f"Tu aides les lycéens et adultes à trouver leur voie.<|eot_id|>"
            f"<|start_header_id|>user<|end_header_id|>\n{instruction}<|eot_id|>"
            f"<|start_header_id|>assistant<|end_header_id|>\n{output}<|eot_id|>"
        )
        textes.append(texte)
    return {"text": textes}

dataset = dataset.map(formater_exemple, batched=True)

# --- Entraînement ---
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length=2048,
    args=TrainingArguments(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,    # batch effectif = 8
        num_train_epochs=3,
        learning_rate=2e-4,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=50,
        save_steps=500,
        output_dir=SORTIE_MODELE,
        warmup_ratio=0.1,
        lr_scheduler_type="cosine",
        report_to="none",
    ),
)

print("Démarrage du fine-tuning...")
trainer_stats = trainer.train()
print(f"Fine-tuning terminé en {trainer_stats.metrics['train_runtime']:.0f} secondes")

# --- Sauvegarde des adapters LoRA ---
model.save_pretrained(SORTIE_MODELE)
tokenizer.save_pretrained(SORTIE_MODELE)
print(f"Adapters LoRA sauvegardés dans {SORTIE_MODELE}")

# --- Fusion modèle + LoRA pour export ---
FastLanguageModel.for_inference(model)
model.save_pretrained_merged(MODELE_FUSIONNE, tokenizer, save_method="merged_16bit")
print(f"Modèle fusionné sauvegardé dans {MODELE_FUSIONNE}")
```

- [ ] **Étape 2 : Lancer le fine-tuning**

```bash
conda activate atlas-ia
python 6_finetuner.py
```

Surveiller la progression — une ligne de log toutes les 50 étapes.
Attendu sur RTX 3070 Ti : 2-4h selon la taille du dataset.

Si erreur CUDA OOM (mémoire insuffisante), réduire `per_device_train_batch_size` à 1.

- [ ] **Étape 3 : Commit**

```bash
git add pipeline/6_finetuner.py
git commit -m "feat: script fine-tuning Unsloth LoRA Llama 3.2 3B"
```

---

## Task 7 : Évaluation du modèle fine-tuné

**Files:**
- Create: `pipeline/7_evaluer.py`

- [ ] **Étape 1 : Créer `pipeline/7_evaluer.py`**

```python
"""
Test rapide du modèle fine-tuné sur 10 questions d'orientation.
Compare les réponses avant/après fine-tuning.
"""

from unsloth import FastLanguageModel
import torch

MODELE = "./models/atlas-ia-merged"

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=MODELE,
    max_seq_length=2048,
    dtype=None,
    load_in_4bit=True,
)
FastLanguageModel.for_inference(model)

QUESTIONS_TEST = [
    "Quelles études pour devenir infirmier ?",
    "Je suis de type Artistique dans le RIASEC, quels métiers me correspondent ?",
    "Quelle est la différence entre un BTS et un IUT ?",
    "Quel est le salaire d'un data scientist débutant ?",
    "Je veux travailler avec les enfants, que faire comme études ?",
    "C'est quoi Parcoursup ?",
    "Quels métiers recrutent le plus en France en ce moment ?",
    "Je veux me reconvertir vers l'informatique, par où commencer ?",
    "Quelle est la différence entre le profil RIASEC S et E ?",
    "Combien d'années d'études pour devenir médecin ?",
]

def interroger(question: str) -> str:
    prompt = (
        f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n"
        f"Tu es Atlas-IA, un conseiller d'orientation professionnelle français expert et bienveillant.<|eot_id|>"
        f"<|start_header_id|>user<|end_header_id|>\n{question}<|eot_id|>"
        f"<|start_header_id|>assistant<|end_header_id|>\n"
    )
    inputs = tokenizer(prompt, return_tensors="pt").to("cuda")
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=300,
            temperature=0.7,
            do_sample=True,
        )
    reponse = tokenizer.decode(outputs[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)
    return reponse.strip()

for i, question in enumerate(QUESTIONS_TEST, 1):
    print(f"\n{'='*50}")
    print(f"Q{i}: {question}")
    print(f"R: {interroger(question)}")

print("\n✓ Évaluation terminée. Vérifie manuellement la qualité des réponses.")
```

- [ ] **Étape 2 : Lancer l'évaluation**

```bash
python 7_evaluer.py
```

Lire chaque réponse et vérifier :
- ✅ Réponse en français
- ✅ Informations correctes sur les études/salaires
- ✅ Ton bienveillant
- ❌ Si le modèle dit "je ne sais pas" souvent → dataset insuffisant, ajouter des données

- [ ] **Étape 3 : Commit**

```bash
git add pipeline/7_evaluer.py
git commit -m "feat: script évaluation modèle fine-tuné"
```

---

## Task 8 : Conversion GGUF + upload Hugging Face

**Files:**
- Create: `pipeline/8_convertir_gguf.py`

- [ ] **Étape 1 : Installer llama.cpp dans WSL2**

```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
cmake -B build -DLLAMA_CUDA=ON
cmake --build build --config Release -j$(nproc)
cd ..
```

- [ ] **Étape 2 : Créer `pipeline/8_convertir_gguf.py`**

```python
"""
Convertit le modèle fusionné en GGUF Q4_K_M.
Q4_K_M = meilleur équilibre qualité/taille pour WebLLM.
Résultat attendu : ~2 Go (vs ~6 Go original).
"""

import subprocess
import os
from pathlib import Path

MODELE_FUSIONNE = Path("./models/atlas-ia-merged")
SORTIE_GGUF = Path("./models/atlas-ia-q4.gguf")
LLAMA_CPP = Path("./llama.cpp")

def convertir():
    # Étape 1 : conversion float16 → GGUF (format intermédiaire)
    gguf_f16 = Path("./models/atlas-ia-f16.gguf")
    subprocess.run([
        "python3", str(LLAMA_CPP / "convert_hf_to_gguf.py"),
        str(MODELE_FUSIONNE),
        "--outfile", str(gguf_f16),
        "--outtype", "f16",
    ], check=True)
    print(f"✓ Conversion f16 terminée : {gguf_f16}")

    # Étape 2 : quantisation Q4_K_M
    subprocess.run([
        str(LLAMA_CPP / "build" / "bin" / "llama-quantize"),
        str(gguf_f16),
        str(SORTIE_GGUF),
        "Q4_K_M",
    ], check=True)
    print(f"✓ Quantisation Q4_K_M terminée : {SORTIE_GGUF}")

    taille = SORTIE_GGUF.stat().st_size / (1024**3)
    print(f"✓ Taille finale : {taille:.2f} Go")

    # Nettoyage du fichier intermédiaire
    gguf_f16.unlink()
    print("✓ Fichier intermédiaire supprimé")

def uploader():
    from huggingface_hub import HfApi
    api = HfApi()
    repo_id = "TON_USERNAME/atlas-ia-3b-q4"  # Remplacer TON_USERNAME

    api.create_repo(repo_id=repo_id, exist_ok=True)
    api.upload_file(
        path_or_fileobj=str(SORTIE_GGUF),
        path_in_repo="atlas-ia-q4.gguf",
        repo_id=repo_id,
    )
    print(f"✓ Modèle uploadé sur https://huggingface.co/{repo_id}")

if __name__ == "__main__":
    convertir()
    uploader()
```

- [ ] **Étape 3 : Modifier `TON_USERNAME` dans le script**

Remplacer `TON_USERNAME` par ton vrai nom d'utilisateur Hugging Face.

- [ ] **Étape 4 : Lancer la conversion et l'upload**

```bash
python 8_convertir_gguf.py
```

Attendu :
```
✓ Conversion f16 terminée
✓ Quantisation Q4_K_M terminée
✓ Taille finale : ~2.0 Go
✓ Modèle uploadé sur https://huggingface.co/TON_USERNAME/atlas-ia-3b-q4
```

- [ ] **Étape 5 : Commit**

```bash
git add pipeline/8_convertir_gguf.py
git commit -m "feat: conversion GGUF Q4 et upload Hugging Face"
```

---

## Task 9 : Migration WebLLM dans l'app Next.js

**Files:**
- Create: `src/lib/webllm-client.ts`, `src/hooks/useWebLLM.ts`, `src/components/chat/ModelLoader.tsx`
- Modify: `src/app/orientation/chat/page.tsx`, `src/components/chat/ChatInterface.tsx`

- [ ] **Étape 1 : Installer WebLLM**

```bash
npm install @mlc-ai/web-llm
```

- [ ] **Étape 2 : Créer `src/lib/webllm-client.ts`**

```typescript
import * as webllm from '@mlc-ai/web-llm'
import { buildSystemPrompt } from './system-prompt'
import type { Message } from './types'

// URL du modèle sur Hugging Face (remplacer TON_USERNAME)
const MODEL_ID = 'TON_USERNAME/atlas-ia-3b-q4'
const MODEL_URL = `https://huggingface.co/${MODEL_ID}/resolve/main/atlas-ia-q4.gguf`

let engine: webllm.MLCEngine | null = null

export async function initialiserWebLLM(
  onProgression: (progression: number, message: string) => void
): Promise<void> {
  engine = new webllm.MLCEngine()

  await engine.reload(MODEL_URL, {
    model_type: 'LlamaForCausalLM',
    initProgressCallback: (rapport) => {
      onProgression(rapport.progress * 100, rapport.text)
    },
  })
}

export async function envoyerMessageWebLLM(
  messages: Message[],
  dernierMessage: string
): Promise<string> {
  if (!engine) throw new Error('WebLLM non initialisé')

  const systemPrompt = buildSystemPrompt('')

  const completion = await engine.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ],
    max_tokens: 600,
    temperature: 0.7,
  })

  return completion.choices[0].message.content ?? ''
}

export function estInitialise(): boolean {
  return engine !== null
}
```

- [ ] **Étape 3 : Créer `src/components/chat/ModelLoader.tsx`**

```typescript
'use client'
import { Progress } from '@/components/ui/progress'

interface ModelLoaderProps {
  progression: number
  message: string
}

export function ModelLoader({ progression, message }: ModelLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <p className="font-serif text-xl text-stone-700 mb-2">
        Chargement d'Atlas-IA...
      </p>
      <p className="text-stone-500 text-sm mb-6 text-center max-w-sm">
        Le modèle se télécharge dans ton navigateur (une seule fois, ~2 Go).
        Les prochaines fois, il se chargera en quelques secondes depuis le cache.
      </p>
      <div className="w-full max-w-sm mb-2">
        <Progress value={progression} className="h-3" />
      </div>
      <p className="text-xs text-stone-400 text-center">{message}</p>
    </div>
  )
}
```

- [ ] **Étape 4 : Créer `src/hooks/useWebLLM.ts`**

```typescript
'use client'
import { useState, useEffect } from 'react'
import { initialiserWebLLM, envoyerMessageWebLLM, estInitialise } from '@/lib/webllm-client'
import type { Message } from '@/lib/types'

export function useWebLLM() {
  const [pret, setPret] = useState(false)
  const [progression, setProgression] = useState(0)
  const [messageChargement, setMessageChargement] = useState('Initialisation...')
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    if (estInitialise()) {
      setPret(true)
      return
    }

    initialiserWebLLM((prog, msg) => {
      setProgression(prog)
      setMessageChargement(msg)
      if (prog >= 100) setPret(true)
    }).catch(e => {
      setErreur('Erreur de chargement. Ton navigateur supporte-t-il WebGPU ? (Chrome 113+)')
      console.error(e)
    })
  }, [])

  const envoyer = async (messages: Message[], dernierMessage: string): Promise<string> => {
    return envoyerMessageWebLLM(messages, dernierMessage)
  }

  return { pret, progression, messageChargement, erreur, envoyer }
}
```

- [ ] **Étape 5 : Modifier `src/components/chat/ChatInterface.tsx`**

Remplacer l'import et la logique d'envoi pour utiliser WebLLM au lieu de l'API Groq :

```typescript
'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { ModelLoader } from './ModelLoader'
import { useWebLLM } from '@/hooks/useWebLLM'
import type { Message } from '@/lib/types'

const MESSAGE_BIENVENUE: Message = {
  role: 'assistant',
  content: 'Bonjour ! Je suis Atlas-IA, ton conseiller d\'orientation. Pose-moi toutes tes questions sur les métiers, les études ou l\'orientation professionnelle. Je suis là pour t\'aider !'
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([MESSAGE_BIENVENUE])
  const [chargement, setChargement] = useState(false)
  const basRef = useRef<HTMLDivElement>(null)
  const { pret, progression, messageChargement, erreur, envoyer } = useWebLLM()

  useEffect(() => {
    basRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (erreur) {
    return (
      <div className="text-center py-16 text-red-600">
        <p>{erreur}</p>
      </div>
    )
  }

  if (!pret) {
    return <ModelLoader progression={progression} message={messageChargement} />
  }

  const envoyerMessage = async (contenu: string) => {
    const userMsg: Message = { role: 'user', content: contenu }
    const nouveauxMessages = [...messages, userMsg]
    setMessages(nouveauxMessages)
    setChargement(true)

    try {
      const reponse = await envoyer(nouveauxMessages.slice(1), contenu)
      setMessages(prev => [...prev, { role: 'assistant', content: reponse }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Désolé, une erreur s\'est produite. Réessaie dans un instant.'
      }])
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
        {chargement && (
          <div className="flex justify-start">
            <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="text-stone-400 text-sm">Atlas-IA réfléchit...</span>
            </div>
          </div>
        )}
        <div ref={basRef} />
      </div>
      <ChatInput onEnvoi={envoyerMessage} disabled={chargement} />
    </div>
  )
}
```

- [ ] **Étape 6 : Modifier `next.config.ts` pour WebGPU**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
      ],
    },
  ],
}

export default nextConfig
```

Ces headers sont obligatoires pour que WebGPU fonctionne dans le navigateur.

- [ ] **Étape 7 : Build et test**

```bash
npm run build
npm run dev
```

Ouvrir http://localhost:3000/orientation/chat dans Chrome 113+.
Attendu : barre de chargement pendant le téléchargement, puis chat fonctionnel.

- [ ] **Étape 8 : Commit**

```bash
git add src/lib/webllm-client.ts src/hooks/useWebLLM.ts src/components/chat/ModelLoader.tsx next.config.ts
git add src/components/chat/ChatInterface.tsx
git commit -m "feat: migration WebLLM — modèle on-device dans le navigateur"
```

---

## Task 10 : API quiz migre vers traitement navigateur

**Files:**
- Modify: `src/app/orientation/quiz/useQuiz.ts`

- [ ] **Étape 1 : Supprimer l'appel API quiz et utiliser la lib directement**

Modifier `src/app/orientation/quiz/useQuiz.ts` — remplacer le fetch `/api/quiz` par un appel direct à `traiterQuiz` :

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { traiterQuiz } from '@/lib/riasec'
import questionsData from '@/data/quiz-questions.json'
import type { QuizQuestion } from '@/lib/types'

const QUESTIONS = questionsData as QuizQuestion[]

export function useQuiz() {
  const [indexCourant, setIndexCourant] = useState(0)
  const [reponses, setReponses] = useState<Record<number, number>>({})
  const [chargement, setChargement] = useState(false)
  const router = useRouter()

  const question = QUESTIONS[indexCourant]
  const progression = (indexCourant / QUESTIONS.length) * 100
  const estDerniere = indexCourant === QUESTIONS.length - 1

  const repondre = (valeur: number) => {
    const nouvellesReponses = { ...reponses, [question.id]: valeur }
    setReponses(nouvellesReponses)

    if (estDerniere) {
      setChargement(true)
      const resultat = traiterQuiz(nouvellesReponses)
      sessionStorage.setItem('atlas-quiz-resultat', JSON.stringify(resultat))
      router.push('/orientation/profil')
    } else {
      setIndexCourant(i => i + 1)
    }
  }

  return { question, indexCourant, total: QUESTIONS.length, progression, repondre, chargement }
}
```

Le quiz est maintenant 100% côté client — plus besoin de l'API route `/api/quiz`.

- [ ] **Étape 2 : Vérifier les tests**

```bash
npm test
npm run build
```

Attendu : tous les tests PASS, build sans erreur.

- [ ] **Étape 3 : Commit**

```bash
git add src/app/orientation/quiz/useQuiz.ts
git commit -m "feat: quiz migré côté client — zéro appel serveur"
git push
```

---

## Checklist de couverture spec Phase 2

| Exigence spec | Task couvrant |
|--------------|---------------|
| Setup WSL2 + Conda + CUDA | Task 1 |
| Dataset ONISEP → JSONL | Task 3 |
| Dataset ROME → JSONL | Task 4 |
| Dataset RIASEC → JSONL | Task 4 |
| Fusion + validation dataset | Task 5 |
| Fine-tuning Unsloth + LoRA | Task 6 |
| Évaluation qualité modèle | Task 7 |
| Conversion GGUF Q4_K_M | Task 8 |
| Upload Hugging Face Hub | Task 8 |
| Migration WebLLM navigateur | Task 9 |
| Quiz 100% client-side | Task 10 |
| Headers WebGPU obligatoires | Task 9 |
