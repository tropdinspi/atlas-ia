"""
Génération de données d'entraînement synthétiques pour Atlas-IA
Ce script lit les métiers depuis src/data/metiers.json et produit un fichier
JSONL dans data/training/synthetic.jsonl, avec 15 templates de questions/réponses
en français (tutoiement, ton conseiller orienteur).
"""

import json
import os
import random

# Chemin du projet (le script est dans /scripts, les données dans /src/data)
RACINE_PROJET = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FICHIER_METIERS = os.path.join(RACINE_PROJET, "src", "data", "metiers.json")
DOSSIER_SORTIE = os.path.join(RACINE_PROJET, "data", "training")
FICHIER_SORTIE = os.path.join(DOSSIER_SORTIE, "synthetic.jsonl")

# Correspondances des codes RIASEC vers des descriptions lisibles
RIASEC_LABELS = {
    "R": "Réaliste (tu aimes travailler avec tes mains, le concret)",
    "I": "Investigateur (tu aimes analyser, comprendre, résoudre des problèmes)",
    "A": "Artistique (tu aimes créer, t'exprimer, innover)",
    "S": "Social (tu aimes aider, accompagner, enseigner)",
    "E": "Entreprenant (tu aimes convaincre, diriger, entreprendre)",
    "C": "Conventionnel (tu aimes l'organisation, les chiffres, la rigueur)",
}


def riasec_vers_texte(codes: list[str]) -> str:
    """Convertit une liste de codes RIASEC en phrase lisible pour un lycéen."""
    descriptions = [RIASEC_LABELS.get(c, c) for c in codes]
    return " et ".join(descriptions)


def generer_exemples(metier: dict) -> list[dict]:
    """
    Pour un métier donné, génère une liste d'exemples au format
    {"instruction": "...", "input": "", "output": "..."}.
    On couvre 6 templates avec plusieurs formulations chacun.
    """
    nom = metier["nom"]
    description = metier["description"]
    riasec = metier["riasec"]
    etudes = metier["etudes"]
    marche = metier["marche"]

    # Données pratiques extraites
    diplome = etudes["diplome"]
    duree = etudes["duree"]
    acces = etudes["acces"]
    bacs = ", ".join(etudes["bacs_conseilles"])

    salaire_debut = marche["salaire_debutant"]
    salaire_exp = marche["salaire_experimente"]
    debouches = marche["debouches"]
    tendance = marche["tendance"]

    debouches_texte = ", ".join(debouches)
    profil_riasec = riasec_vers_texte(riasec)

    exemples = []

    # ------------------------------------------------------------------
    # Template 1 — Description du métier (3 formulations)
    # ------------------------------------------------------------------
    questions_t1 = [
        f"C'est quoi le métier de {nom} ?",
        f"Décris-moi le métier de {nom}.",
        f"En quoi consiste le travail d'un {nom} ?",
    ]
    reponse_t1 = (
        f"{description} "
        f"Tu peux travailler dans des endroits variés comme : {debouches_texte}. "
        f"{tendance}."
    )
    for question in questions_t1:
        exemples.append({"instruction": question, "input": "", "output": reponse_t1})

    # ------------------------------------------------------------------
    # Template 2 — Études requises (3 formulations)
    # ------------------------------------------------------------------
    questions_t2 = [
        f"Quelles études pour devenir {nom} ?",
        f"Quel diplôme faut-il pour être {nom} ?",
        f"Comment devenir {nom} après le bac ?",
    ]
    reponse_t2 = (
        f"Pour devenir {nom}, il faut obtenir le {diplome}, "
        f"une formation de {duree}. "
        f"L'accès se fait via {acces}. "
        f"Les bacs conseillés sont : {bacs}."
    )
    for question in questions_t2:
        exemples.append({"instruction": question, "input": "", "output": reponse_t2})

    # ------------------------------------------------------------------
    # Template 3 — Salaire (3 formulations)
    # ------------------------------------------------------------------
    questions_t3 = [
        f"Combien gagne un {nom} ?",
        f"Quel est le salaire d'un {nom} ?",
        f"C'est bien payé, {nom} ?",
    ]
    reponse_t3 = (
        f"En début de carrière, un {nom} gagne environ {salaire_debut}. "
        f"Avec de l'expérience, le salaire peut atteindre {salaire_exp}. "
        f"{tendance}."
    )
    for question in questions_t3:
        exemples.append({"instruction": question, "input": "", "output": reponse_t3})

    # ------------------------------------------------------------------
    # Template 4 — Débouchés (2 formulations)
    # ------------------------------------------------------------------
    questions_t4 = [
        f"Quels sont les débouchés pour {nom} ?",
        f"Où peut travailler un {nom} ?",
    ]
    reponse_t4 = (
        f"En tant que {nom}, tu peux travailler dans ces secteurs ou structures : "
        f"{debouches_texte}. "
        f"Côté marché : {tendance}."
    )
    for question in questions_t4:
        exemples.append({"instruction": question, "input": "", "output": reponse_t4})

    # ------------------------------------------------------------------
    # Template 5 — Est-ce fait pour moi / qualités (2 formulations)
    # ------------------------------------------------------------------
    questions_t5 = [
        f"Est-ce que le métier de {nom} me conviendrait si j'aime aider les gens ?",
        f"Quelles qualités faut-il pour être {nom} ?",
    ]
    reponse_t5 = (
        f"Le métier de {nom} correspond plutôt à un profil {profil_riasec}. "
        f"Si tu te reconnais dans ces traits, ce métier peut vraiment te convenir. "
        f"C'est un domaine où {description.lower()}"
    )
    # On s'assure que la réponse se termine par un point
    if not reponse_t5.endswith("."):
        reponse_t5 += "."
    for question in questions_t5:
        exemples.append({"instruction": question, "input": "", "output": reponse_t5})

    # ------------------------------------------------------------------
    # Template 6 — Durée des études (2 formulations)
    # ------------------------------------------------------------------
    questions_t6 = [
        f"Les études de {nom}, c'est long ?",
        f"Combien d'années d'études pour {nom} ?",
    ]
    reponse_t6 = (
        f"Les études pour devenir {nom} durent {duree}. "
        f"Tu passes par {acces}. "
        f"C'est un investissement qui en vaut la peine, surtout avec un marché où : {tendance.lower()}."
    )
    for question in questions_t6:
        exemples.append({"instruction": question, "input": "", "output": reponse_t6})

    return exemples


def main():
    # Lecture du fichier de métiers
    with open(FICHIER_METIERS, encoding="utf-8") as f:
        metiers = json.load(f)

    # Création du dossier de sortie s'il n'existe pas
    os.makedirs(DOSSIER_SORTIE, exist_ok=True)

    total = 0

    with open(FICHIER_SORTIE, "w", encoding="utf-8") as f_out:
        for metier in metiers:
            exemples = generer_exemples(metier)
            for exemple in exemples:
                # Chaque ligne est un objet JSON indépendant (format JSONL)
                ligne = json.dumps(exemple, ensure_ascii=False)
                f_out.write(ligne + "\n")
                total += 1

    print(f"OK - {total} exemples generes dans data/training/synthetic.jsonl")


if __name__ == "__main__":
    main()
