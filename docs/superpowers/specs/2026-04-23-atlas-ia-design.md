# Atlas-IA — Spec Design
Date : 2026-04-23

## Résumé

Atlas-IA est une intelligence artificielle d'orientation professionnelle francophone, conçue pour aider les lycéens (15–18 ans) à découvrir leur voie, avec une couverture secondaire pour les étudiants en réorientation et les adultes en reconversion. L'IA tourne entièrement dans le navigateur de l'utilisateur (on-device) en Phase 2 — aucune donnée privée ne transite par un serveur.

---

## 1. Utilisateurs cibles

| Priorité | Profil | Cas d'usage principal |
|----------|--------|-----------------------|
| Primaire | Lycéens 15–18 ans | Choisir son orientation post-bac (Parcoursup, BTS, IUT, Prépa) |
| Secondaire | Étudiants 18–25 ans | Se réorienter après une première filière |
| Tertiaire | Adultes 30–50 ans | Reconversion professionnelle |

---

## 2. Fonctionnalités

### 2.1 Chat libre
- L'utilisateur pose des questions en langage naturel
- Exemples : "C'est quoi le métier d'UX designer ?", "Quelles études pour devenir infirmier ?"
- L'IA répond avec des informations précises issues de ONISEP et ROME
- Pas de stockage des conversations (RGPD)

### 2.2 Quiz RIASEC
- 30 questions pré-écrites basées sur le modèle Holland (domaine public) — questions fixes, pas générées par l'IA
- 6 profils : Réaliste, Investigateur, Artistique, Social, Entrepreneur, Conventionnel
- Calcul automatique du score RIASEC de l'utilisateur
- Suggestion de 8 à 10 métiers correspondants au profil
- Pour chaque métier suggéré :
  - Description courte accessible
  - Études requises (source ONISEP)
  - Débouchés et salaire moyen (source ROME)
  - Lien vers la fiche ONISEP officielle

### 2.3 Pages de l'application

```
/                    → Landing page (pitch, CTA, exemples)
/orientation         → Hub : choix entre Chat ou Quiz
/orientation/chat    → Chat libre avec l'IA
/orientation/quiz    → Quiz RIASEC (30 questions)
/orientation/profil  → Résultats + métiers + rapport
/a-propos            → Crédibilité, sources, équipe
```

---

## 3. Architecture — Deux phases

### Phase 1 — MVP (semaines 1–2)

Objectif : produit réel déployé, testable par de vrais lycéens.

```
Navigateur utilisateur
        ↓
Next.js App (Vercel)
        ↓
Vercel Serverless Functions (API Routes)
        ↓
Groq API (Llama 3.2 3B — tier gratuit : 30 req/min)
        +
Base ONISEP/ROME en JSON local (injectée dans le prompt)
```

**Collecte de données Phase 1 :**
Chaque échange de qualité (validé manuellement) est sauvegardé au format JSONL pour construire le dataset de fine-tuning Phase 2.

### Phase 2 — On-device (semaines 3–8)

Objectif : zéro coût serveur, 100% RGPD, modèle propriétaire.

```
Navigateur utilisateur (Chrome 113+)
├── WebLLM (@mlc-ai/web-llm)
│   └── Llama 3.2 3B fine-tuné → GGUF Q4_K_M (~2 Go)
│       (téléchargé une fois depuis Hugging Face Hub)
├── Transformers.js (@xenova/transformers)
│   └── Embeddings pour la recherche sémantique
└── IndexedDB (base de données native du navigateur)
    └── Vecteurs ONISEP/ROME (~800 fiches métiers)
```

**Flux RAG (Retrieval Augmented Generation) :**
```
1. Utilisateur envoie un message
2. Transformers.js convertit le message en vecteur
3. IndexedDB récupère les 5 fiches métiers les plus proches
4. Ces fiches sont injectées dans le prompt WebLLM
5. Llama répond avec des infos réelles → zéro hallucination
6. Rien ne quitte le navigateur
```

**Vercel en Phase 2 = uniquement des fichiers statiques = 0€/mois**

---

## 4. Dataset & Fine-tuning

### 4.1 Sources de données

| Source | Contenu | Accès |
|--------|---------|-------|
| ONISEP Open Data (data.onisep.fr) | 800+ fiches métiers, formations, Parcoursup | Gratuit, légal |
| ROME v4 (francetravail.io/opendata) | 531 métiers, compétences, salaires | Gratuit, légal |
| Holland RIASEC | 30 questions, 6 profils, mapping métiers | Domaine public |
| Conversations Phase 1 | Échanges réels collectés et validés | Propriétaire |

### 4.2 Volume cible du dataset

```
2 000 Q/R sur les métiers (ONISEP/ROME)
1 000 échanges de profil RIASEC
  500 conversations reconversion adulte
1 500 conversations réelles collectées en Phase 1
─────────────────────────────────────────────────
5 000 exemples total → format JSONL
```

### 4.3 Format JSONL

```jsonl
{
  "instruction": "Quelles études pour devenir infirmier ?",
  "input": "",
  "output": "Pour devenir infirmier, tu dois obtenir le Diplôme d'État Infirmier (DEI), une formation de 3 ans accessible après le bac. L'entrée se fait via Parcoursup (filière IFSI). Le salaire débutant est d'environ 1 800€ net/mois, avec des débouchés en hôpital, clinique ou en libéral."
}
```

### 4.4 Pipeline de fine-tuning

```
Environnement : WSL2 + Conda + Python 3.12
GPU           : RTX 3070 Ti (8 Go VRAM)
Bibliothèque  : Unsloth (utilise 3–4 Go VRAM)
Modèle base   : meta-llama/Llama-3.2-3B-Instruct
Méthode       : LoRA (entraîne 1–2% des paramètres)
Durée estimée : 2–3h pour 5 000 exemples
Export        : GGUF Q4_K_M via llama.cpp (~2 Go)
Hébergement   : Hugging Face Hub (gratuit, 50 Go)
```

### 4.5 Contrôle qualité du dataset

Script Python de validation automatique :
- Longueur réponse entre 50 et 500 mots
- Pas de doublon (hash SHA-256 de l'instruction)
- Pas de marqueurs d'incertitude ("je ne sais pas", "peut-être")
- Ton bienveillant (absence de langage négatif ou condescendant)

---

## 5. Stack technique

```
Frontend
├── Next.js 15 (App Router)
├── TypeScript strict
├── Tailwind CSS
├── shadcn/ui (composants)
└── Vercel (déploiement, gratuit)

Phase 1 — Backend temporaire
├── Vercel API Routes (serverless)
└── Groq SDK (@groq-sdk/node)

Phase 2 — On-device
├── @mlc-ai/web-llm
├── @xenova/transformers
└── IndexedDB (natif navigateur)

Outils de développement local
├── Python 3.12 + Conda (fine-tuning)
├── Unsloth (fine-tuning optimisé GPU)
├── Hugging Face CLI (téléchargement modèles)
├── llama.cpp (conversion GGUF)
└── Ollama (tests locaux du modèle GGUF)
```

---

## 6. Design & UX

- Police : Instrument Serif (titres) + Inter (corps) — lisible pour lycéens
- Palette : tons neutres chauds (crème, brun clair) + accent vert forêt — sérieux sans être austère
- Pas de dégradés violets, pas de glassmorphism générique
- Interface mobile-first (les lycéens consultent sur téléphone)
- Temps de réponse affiché pendant le chargement du modèle Phase 2 (~15 secondes au premier chargement)

---

## 7. Business model

### V1 — Lancement (dès Phase 1)
- Tout gratuit, sans inscription obligatoire
- Objectif : 200–300 utilisateurs, témoignages, retours réels

### V2 — Freemium (après validation)
- Gratuit : quiz RIASEC + 3 métiers suggérés + chat limité
- Payant 4,99€ (achat unique) : 10 métiers complets + rapport PDF + chat illimité
- Paiement via Stripe

### V3 — B2B établissements scolaires
- Package lycée : 400–800€/an pour tous les élèves
- Dashboard pour CPE et conseillers d'orientation
- Cycle de vente long mais revenu récurrent stable

---

## 8. RGPD & légalité

- Phase 1 : aucun stockage de conversation, politique de confidentialité claire
- Phase 2 : traitement 100% on-device, aucune donnée ne quitte le navigateur — argument de vente fort. Les vecteurs ONISEP/ROME sont pré-calculés et livrés avec l'app (chargement IndexedDB au premier lancement).
- Modèle base : Llama 3.2 (licence Meta) — autorisation de revente commerciale
- Droit de revente : oui, sous condition de nommer le modèle de base dans la documentation
- Nom du modèle : "Atlas-IA" (nom propriétaire sur Llama 3.2)

---

## 9. Ce qui a été retiré du plan original

| Élément retiré | Raison |
|---------------|--------|
| Développement personnel (Ikigai, roue de vie, SMART) | Hors scope — focus orientation uniquement |
| Application mobile Phase 1 | Trop complexe pour commencer, prévu en V3 |
| Application desktop (Electron) | Inutile si WebLLM couvre le cas d'usage |
| Fine-tuning sur faits métiers uniquement | Remplacé par RAG (meilleure fiabilité factuelle) |

---

## 10. Risques identifiés

| Risque | Probabilité | Mitigation |
|--------|-------------|------------|
| WebGPU non supporté sur vieux PC scolaires | Moyenne | Fallback vers Groq API (Phase 1) conservé |
| Dataset insuffisant en qualité | Haute | Phase 1 de collecte obligatoire avant fine-tuning |
| Temps de fine-tuning sous-estimé | Faible | Unsloth + LoRA bien documenté sur 3070 Ti |
| Conversion GGUF difficile | Faible | llama.cpp est le standard, documentation abondante |
| Zéro utilisateur au lancement | Moyenne | Approcher directement 2–3 lycées locaux pour tester |
