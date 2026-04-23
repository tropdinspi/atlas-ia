# Atlas-IA Phase 1 — Plan d'implémentation MVP

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire l'application web Atlas-IA avec chat orientation + quiz RIASEC, alimentée par Groq API, déployée sur Vercel.

**Architecture:** Next.js 15 App Router + TypeScript. API Routes serverless qui appellent Groq (Llama 3.1 8B). Données ONISEP/ROME stockées en JSON local injectées dans le prompt (RAG simplifié). Aucune base de données — tout est stateless.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Groq SDK, Jest + Testing Library, Vercel.

---

## Structure des fichiers

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        ← Landing page
│   ├── a-propos/page.tsx
│   ├── orientation/
│   │   ├── page.tsx                    ← Hub : Chat ou Quiz
│   │   ├── chat/page.tsx
│   │   ├── quiz/page.tsx
│   │   └── profil/page.tsx
│   └── api/
│       ├── chat/route.ts               ← Appel Groq streaming
│       └── quiz/route.ts               ← Calcul résultats RIASEC
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── MessageBubble.tsx
│   │   └── ChatInput.tsx
│   └── quiz/
│       ├── QuizQuestion.tsx
│       ├── QuizProgress.tsx
│       ├── QuizResults.tsx
│       └── MetierCard.tsx
├── lib/
│   ├── types.ts
│   ├── riasec.ts                       ← Logique scoring (pur, testable)
│   ├── data-loader.ts                  ← Lecture JSON + recherche sémantique simple
│   ├── system-prompt.ts
│   └── __tests__/
│       ├── riasec.test.ts
│       └── data-loader.test.ts
└── data/
    ├── metiers.json                    ← 20 métiers MVP
    ├── quiz-questions.json             ← 30 questions RIASEC
    └── riasec-descriptions.json        ← Labels des 6 types Holland
```

---

## Task 1 : Initialisation du projet

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.env.local`, `.gitignore`

- [ ] **Étape 1 : Créer le projet Next.js dans le dossier courant**

```bash
cd "c:/Users/matia/source/repos/mon ia"
npx create-next-app@latest . --typescript --eslint --tailwind --src-dir --app --no-turbopack --import-alias "@/*"
```

Répondre aux prompts :
- Would you like to use Turbopack? → **No**
- (les autres options sont passées via les flags)

- [ ] **Étape 2 : Installer les dépendances**

```bash
npm install groq-sdk
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest @types/jest
```

- [ ] **Étape 3 : Installer shadcn/ui**

```bash
npx shadcn@latest init
```

Répondre aux prompts :
- Style: **Default**
- Base color: **Neutral**
- CSS variables: **Yes**

- [ ] **Étape 4 : Ajouter les composants shadcn/ui nécessaires**

```bash
npx shadcn@latest add button card input badge progress separator scroll-area
```

- [ ] **Étape 5 : Configurer Jest**

Créer `jest.config.ts` :

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
}

export default createJestConfig(config)
```

Créer `jest.setup.ts` :

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Étape 6 : Ajouter les scripts dans `package.json`**

Dans la section `"scripts"`, ajouter :

```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Étape 7 : Créer `.env.local`**

```bash
GROQ_API_KEY=gsk_REMPLACER_PAR_TA_VRAIE_CLE
```

Obtenir la clé sur : https://console.groq.com/keys

- [ ] **Étape 8 : Ajouter `.env.local` au `.gitignore`**

Vérifier que `.gitignore` contient `.env.local` (Next.js l'ajoute automatiquement).

- [ ] **Étape 9 : Vérifier que le projet démarre**

```bash
npm run dev
```

Attendu : `✓ Ready in Xs` sur http://localhost:3000

- [ ] **Étape 10 : Commit**

```bash
git init
git add -A
git commit -m "feat: initialisation projet Atlas-IA Next.js 15"
```

---

## Task 2 : Types TypeScript

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Étape 1 : Créer `src/lib/types.ts`**

```typescript
export type RiasecType = 'R' | 'I' | 'A' | 'S' | 'E' | 'C'

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface Metier {
  id: string
  nom: string
  description: string
  riasec: RiasecType[]
  etudes: {
    diplome: string
    duree: string
    acces: string
    bacs_conseilles: string[]
  }
  marche: {
    salaire_debutant: string
    salaire_experimente: string
    debouches: string[]
    tendance: string
  }
  lien_onisep: string
}

export interface QuizQuestion {
  id: number
  texte: string
  type: RiasecType
}

export interface RiasecScores {
  R: number
  I: number
  A: number
  S: number
  E: number
  C: number
}

export interface QuizResult {
  scores: RiasecScores
  profil: RiasecType[]
  metiers: Metier[]
}

export interface RiasecDescription {
  type: RiasecType
  label: string
  description: string
  mots_cles: string[]
}
```

- [ ] **Étape 2 : Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: types TypeScript Atlas-IA"
```

---

## Task 3 : Données statiques — Questions RIASEC

**Files:**
- Create: `src/data/quiz-questions.json`, `src/data/riasec-descriptions.json`

- [ ] **Étape 1 : Créer `src/data/quiz-questions.json`**

```json
[
  { "id": 1,  "texte": "J'aime travailler avec mes mains pour fabriquer ou réparer des objets", "type": "R" },
  { "id": 2,  "texte": "J'aime les activités physiques ou sportives au quotidien", "type": "R" },
  { "id": 3,  "texte": "Je me sens à l'aise sur un chantier, dans un atelier ou un laboratoire pratique", "type": "R" },
  { "id": 4,  "texte": "J'aime utiliser des outils, des machines ou des équipements techniques", "type": "R" },
  { "id": 5,  "texte": "Je préfère les tâches concrètes aux tâches abstraites ou théoriques", "type": "R" },
  { "id": 6,  "texte": "J'aime résoudre des problèmes complexes qui demandent de la réflexion", "type": "I" },
  { "id": 7,  "texte": "La science, la recherche ou l'analyse de données m'attire vraiment", "type": "I" },
  { "id": 8,  "texte": "J'aime comprendre comment les choses fonctionnent en détail", "type": "I" },
  { "id": 9,  "texte": "Je lis volontiers des articles ou des livres sur des sujets techniques ou scientifiques", "type": "I" },
  { "id": 10, "texte": "J'aime poser des questions et trouver des réponses par moi-même", "type": "I" },
  { "id": 11, "texte": "J'aime créer des choses nouvelles et originales", "type": "A" },
  { "id": 12, "texte": "L'art, la musique, l'écriture ou le design me passionnent", "type": "A" },
  { "id": 13, "texte": "J'ai besoin d'exprimer ma créativité dans mon travail", "type": "A" },
  { "id": 14, "texte": "Je préfère les environnements de travail flexibles et non-routiniers", "type": "A" },
  { "id": 15, "texte": "J'aime imaginer de nouvelles façons de faire les choses", "type": "A" },
  { "id": 16, "texte": "J'aime aider les autres à résoudre leurs problèmes personnels ou professionnels", "type": "S" },
  { "id": 17, "texte": "Travailler en équipe ou avec le public me plaît vraiment", "type": "S" },
  { "id": 18, "texte": "J'aime enseigner, former ou accompagner des personnes", "type": "S" },
  { "id": 19, "texte": "Je suis à l'aise pour écouter les autres et les comprendre", "type": "S" },
  { "id": 20, "texte": "La communication et les relations humaines sont très importantes pour moi", "type": "S" },
  { "id": 21, "texte": "J'aime convaincre, persuader ou négocier avec les autres", "type": "E" },
  { "id": 22, "texte": "Diriger un projet ou une équipe me motive vraiment", "type": "E" },
  { "id": 23, "texte": "Je suis à l'aise pour prendre des décisions et assumer des responsabilités", "type": "E" },
  { "id": 24, "texte": "J'aime les défis et je ne crains pas de prendre des risques calculés", "type": "E" },
  { "id": 25, "texte": "L'idée de créer ou de gérer une entreprise m'attire", "type": "E" },
  { "id": 26, "texte": "J'aime travailler avec des chiffres, des données ou des tableaux", "type": "C" },
  { "id": 27, "texte": "Je préfère suivre des procédures claires plutôt qu'improviser", "type": "C" },
  { "id": 28, "texte": "J'aime organiser, classer et structurer l'information", "type": "C" },
  { "id": 29, "texte": "La précision et l'exactitude sont très importantes pour moi dans mon travail", "type": "C" },
  { "id": 30, "texte": "Je préfère les environnements de travail stables et bien organisés", "type": "C" }
]
```

- [ ] **Étape 2 : Créer `src/data/riasec-descriptions.json`**

```json
[
  {
    "type": "R",
    "label": "Réaliste",
    "description": "Tu aimes le travail concret, manuel et technique. Tu préfères agir plutôt que parler.",
    "mots_cles": ["technique", "manuel", "concret", "terrain", "précis"]
  },
  {
    "type": "I",
    "label": "Investigateur",
    "description": "Tu aimes analyser, comprendre et résoudre des problèmes complexes. La curiosité intellectuelle te définit.",
    "mots_cles": ["analyse", "recherche", "science", "réflexion", "curiosité"]
  },
  {
    "type": "A",
    "label": "Artistique",
    "description": "Tu as besoin de créativité et d'expression dans ton travail. Tu aimes l'originalité et l'innovation.",
    "mots_cles": ["créativité", "expression", "design", "originalité", "liberté"]
  },
  {
    "type": "S",
    "label": "Social",
    "description": "Tu t'épanouis en aidant et en travaillant avec les autres. Les relations humaines sont au cœur de ta motivation.",
    "mots_cles": ["aide", "équipe", "communication", "humain", "soin"]
  },
  {
    "type": "E",
    "label": "Entrepreneur",
    "description": "Tu aimes diriger, convaincre et prendre des initiatives. Le leadership et l'ambition te caractérisent.",
    "mots_cles": ["leadership", "ambition", "vente", "influence", "projet"]
  },
  {
    "type": "C",
    "label": "Conventionnel",
    "description": "Tu aimes l'ordre, la précision et le travail bien structuré. La fiabilité et la méthode sont tes forces.",
    "mots_cles": ["organisation", "précision", "méthode", "données", "structure"]
  }
]
```

- [ ] **Étape 3 : Commit**

```bash
git add src/data/
git commit -m "feat: données quiz RIASEC (30 questions + descriptions)"
```

---

## Task 4 : Données métiers MVP

**Files:**
- Create: `src/data/metiers.json`

- [ ] **Étape 1 : Créer `src/data/metiers.json`**

```json
[
  {
    "id": "infirmier",
    "nom": "Infirmier / Infirmière",
    "description": "Prend en charge les patients, administre les soins prescrits et assure la surveillance médicale. Travaille en hôpital, clinique, EHPAD ou en libéral.",
    "riasec": ["S", "R"],
    "etudes": {
      "diplome": "Diplôme d'État Infirmier (DEI)",
      "duree": "3 ans après le bac",
      "acces": "Parcoursup — IFSI (Institut de Formation en Soins Infirmiers)",
      "bacs_conseilles": ["Bac général (SVT conseillée)", "Bac STSS"]
    },
    "marche": {
      "salaire_debutant": "1 800 € net/mois",
      "salaire_experimente": "2 500 € net/mois",
      "debouches": ["Hôpital", "Clinique", "EHPAD", "Infirmier libéral", "Scolaire"],
      "tendance": "Forte demande, nombreux postes disponibles"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/infirmier-infirmiere"
  },
  {
    "id": "medecin-generaliste",
    "nom": "Médecin généraliste",
    "description": "Diagnostique et traite les maladies courantes, oriente vers les spécialistes. Premier recours pour les patients.",
    "riasec": ["I", "S"],
    "etudes": {
      "diplome": "Doctorat en médecine (DES Médecine Générale)",
      "duree": "9 ans après le bac (PASS + 8 ans)",
      "acces": "Parcoursup — PASS ou L.AS, puis concours",
      "bacs_conseilles": ["Bac général (Maths + SVT indispensables)"]
    },
    "marche": {
      "salaire_debutant": "3 500 € net/mois (remplaçant)",
      "salaire_experimente": "6 000 € net/mois (installé)",
      "debouches": ["Cabinet libéral", "Hôpital", "Centre de santé", "Médecine du travail"],
      "tendance": "Déserts médicaux créent un fort besoin"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/medecin"
  },
  {
    "id": "enseignant",
    "nom": "Enseignant / Professeur",
    "description": "Transmet des savoirs et accompagne les élèves dans leur apprentissage. Du primaire au supérieur.",
    "riasec": ["S", "A", "I"],
    "etudes": {
      "diplome": "Master MEEF (Métiers de l'Enseignement, de l'Éducation et de la Formation)",
      "duree": "5 ans après le bac (Licence + Master)",
      "acces": "Parcoursup pour la Licence, puis concours CAPES ou CRPE",
      "bacs_conseilles": ["Bac général selon la matière enseignée"]
    },
    "marche": {
      "salaire_debutant": "1 900 € net/mois",
      "salaire_experimente": "2 800 € net/mois",
      "debouches": ["École primaire", "Collège", "Lycée", "Enseignement supérieur"],
      "tendance": "Recrutement important, vacances scolaires avantageuses"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/professeur-des-ecoles"
  },
  {
    "id": "psychologue",
    "nom": "Psychologue",
    "description": "Accompagne les individus dans leurs difficultés psychologiques, réalise des bilans et des thérapies.",
    "riasec": ["S", "I", "A"],
    "etudes": {
      "diplome": "Master de Psychologie (bac+5)",
      "duree": "5 ans après le bac",
      "acces": "Parcoursup — Licence de Psychologie",
      "bacs_conseilles": ["Bac général (SES, Philosophie, SVT)"]
    },
    "marche": {
      "salaire_debutant": "1 700 € net/mois",
      "salaire_experimente": "2 800 € net/mois (libéral : variable)",
      "debouches": ["Hôpital", "Cabinet libéral", "Scolaire", "RH entreprise", "Associations"],
      "tendance": "Demande croissante, profession réglementée"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/psychologue"
  },
  {
    "id": "ingenieur-informatique",
    "nom": "Ingénieur informatique / Développeur",
    "description": "Conçoit, développe et maintient des logiciels, applications ou systèmes informatiques.",
    "riasec": ["I", "R", "C"],
    "etudes": {
      "diplome": "École d'ingénieur ou Master Informatique (bac+5)",
      "duree": "5 ans après le bac",
      "acces": "Parcoursup — IUT Informatique (bac+2) ou CPGE puis école, ou Licence Informatique",
      "bacs_conseilles": ["Bac général (Maths + NSI fortement conseillés)"]
    },
    "marche": {
      "salaire_debutant": "2 800 € net/mois",
      "salaire_experimente": "4 500 € net/mois",
      "debouches": ["Startup", "Grande entreprise", "ESN", "Freelance", "Jeux vidéo"],
      "tendance": "Un des secteurs les plus recruteurs en France"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/ingenieur-en-informatique"
  },
  {
    "id": "data-scientist",
    "nom": "Data Scientist",
    "description": "Analyse de grandes quantités de données pour en extraire des informations utiles à la prise de décision.",
    "riasec": ["I", "C", "R"],
    "etudes": {
      "diplome": "Master Statistiques / Data Science ou école d'ingénieur (bac+5)",
      "duree": "5 ans après le bac",
      "acces": "Parcoursup — Licence Maths/Informatique/Économie",
      "bacs_conseilles": ["Bac général (Maths obligatoire, NSI conseillée)"]
    },
    "marche": {
      "salaire_debutant": "3 000 € net/mois",
      "salaire_experimente": "5 000 € net/mois",
      "debouches": ["Finance", "Santé", "Marketing", "Tech", "Recherche"],
      "tendance": "Métier d'avenir, forte demande"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/data-scientist"
  },
  {
    "id": "graphiste",
    "nom": "Graphiste / Designer graphique",
    "description": "Crée des visuels, logos, affiches, supports de communication print et digital.",
    "riasec": ["A", "I", "E"],
    "etudes": {
      "diplome": "BTS Design Graphique ou DN MADE ou Bachelor Design",
      "duree": "2 à 3 ans après le bac",
      "acces": "Parcoursup — BTS Communication Visuelle ou école privée",
      "bacs_conseilles": ["Bac général", "Bac STHR", "Bac Arts Appliqués"]
    },
    "marche": {
      "salaire_debutant": "1 600 € net/mois",
      "salaire_experimente": "2 500 € net/mois (freelance : variable)",
      "debouches": ["Agence de com", "Studio design", "Freelance", "In-house entreprise"],
      "tendance": "Compétitif, portfolio indispensable"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/graphiste"
  },
  {
    "id": "ux-designer",
    "nom": "Designer UX/UI",
    "description": "Conçoit des interfaces numériques intuitives et agréables (sites, apps). Mêle design et psychologie utilisateur.",
    "riasec": ["A", "I", "E"],
    "etudes": {
      "diplome": "Bachelor ou Master UX Design / Interaction Design",
      "duree": "3 à 5 ans après le bac",
      "acces": "Parcoursup ou école privée spécialisée",
      "bacs_conseilles": ["Bac général", "Bac STI2D"]
    },
    "marche": {
      "salaire_debutant": "2 200 € net/mois",
      "salaire_experimente": "3 800 € net/mois",
      "debouches": ["Startup", "Agence digitale", "Grande entreprise", "Freelance"],
      "tendance": "Très forte demande depuis 2020"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/designer-ux"
  },
  {
    "id": "journaliste",
    "nom": "Journaliste",
    "description": "Collecte, vérifie et diffuse l'information auprès du public via la presse, radio, TV ou web.",
    "riasec": ["A", "S", "E"],
    "etudes": {
      "diplome": "Diplôme d'école de journalisme reconnue (bac+5)",
      "duree": "5 ans après le bac",
      "acces": "Concours d'entrée en école après Licence (CFJ, ESJ, IJBA…)",
      "bacs_conseilles": ["Bac général (Lettres, Histoire, Langues conseillées)"]
    },
    "marche": {
      "salaire_debutant": "1 700 € net/mois",
      "salaire_experimente": "2 800 € net/mois",
      "debouches": ["Presse écrite", "Radio", "Télévision", "Médias en ligne", "Pigiste"],
      "tendance": "Secteur en mutation, digital en croissance"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/journaliste"
  },
  {
    "id": "architecte",
    "nom": "Architecte",
    "description": "Conçoit des bâtiments et espaces en alliant esthétique, fonctionnalité et réglementation.",
    "riasec": ["A", "R", "I"],
    "etudes": {
      "diplome": "DPLG / HMONP (bac+6 minimum)",
      "duree": "6 ans après le bac (ENSA)",
      "acces": "Parcoursup — École Nationale Supérieure d'Architecture",
      "bacs_conseilles": ["Bac général (Maths, Arts Plastiques)"]
    },
    "marche": {
      "salaire_debutant": "1 800 € net/mois",
      "salaire_experimente": "3 500 € net/mois (libéral : très variable)",
      "debouches": ["Cabinet d'architecture", "Promoteur immobilier", "Collectivités", "Freelance"],
      "tendance": "Stable, rénovation énergétique crée de nouveaux besoins"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/architecte"
  },
  {
    "id": "electricien",
    "nom": "Électricien / Électrotechnicien",
    "description": "Installe, entretient et dépanne les installations électriques dans les bâtiments ou l'industrie.",
    "riasec": ["R", "I"],
    "etudes": {
      "diplome": "CAP Électricien ou Bac Pro MELEC ou BTS Électrotechnique",
      "duree": "2 à 4 ans après le collège/bac",
      "acces": "Parcoursup ou apprentissage (très apprécié)",
      "bacs_conseilles": ["Bac Pro MELEC", "Bac STI2D"]
    },
    "marche": {
      "salaire_debutant": "1 700 € net/mois",
      "salaire_experimente": "2 500 € net/mois (chef d'équipe)",
      "debouches": ["BTP", "Industrie", "Maintenance", "Auto-entrepreneur"],
      "tendance": "Très forte demande, pénurie de profils"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/electricien-du-batiment"
  },
  {
    "id": "kinesitherapeute",
    "nom": "Kinésithérapeute",
    "description": "Rééduque les patients après blessure, opération ou maladie grâce à des techniques manuelles et physiques.",
    "riasec": ["S", "R", "I"],
    "etudes": {
      "diplome": "Diplôme d'État de Masseur-Kinésithérapeute (DEMK)",
      "duree": "5 ans après le bac (1 an PASS + 4 ans IFMK)",
      "acces": "Parcoursup — PASS ou L.AS puis sélection IFMK",
      "bacs_conseilles": ["Bac général (SVT + Maths conseillés)"]
    },
    "marche": {
      "salaire_debutant": "2 000 € net/mois",
      "salaire_experimente": "4 000 € net/mois (libéral)",
      "debouches": ["Cabinet libéral", "Hôpital", "Clinique de rééducation", "Sport"],
      "tendance": "Excellents débouchés, vieillissement population"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/masseur-kinesitherapeute"
  },
  {
    "id": "commercial",
    "nom": "Commercial / Chargé de clientèle",
    "description": "Prospecte de nouveaux clients, gère un portefeuille et atteint des objectifs de vente.",
    "riasec": ["E", "S"],
    "etudes": {
      "diplome": "BTS NDRC ou MCO ou Licence Pro Commerce",
      "duree": "2 à 3 ans après le bac",
      "acces": "Parcoursup — BTS ou IUT Techniques de Commercialisation",
      "bacs_conseilles": ["Bac général", "Bac STMG"]
    },
    "marche": {
      "salaire_debutant": "1 800 € + variable",
      "salaire_experimente": "3 500 € + variable",
      "debouches": ["Tous secteurs", "B2B", "B2C", "Immobilier", "Assurance"],
      "tendance": "Toujours recruteur, variable peut être très attractif"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/commercial"
  },
  {
    "id": "avocat",
    "nom": "Avocat",
    "description": "Défend les intérêts de ses clients en justice et les conseille sur les questions juridiques.",
    "riasec": ["E", "S", "I"],
    "etudes": {
      "diplome": "CAPA (Certificat d'Aptitude à la Profession d'Avocat)",
      "duree": "7 ans après le bac (Licence Droit + Master + CRFPA + EFB)",
      "acces": "Parcoursup — Licence de Droit",
      "bacs_conseilles": ["Bac général (Maths, Philosophie, Histoire conseillés)"]
    },
    "marche": {
      "salaire_debutant": "2 000 € net/mois (collaborateur)",
      "salaire_experimente": "5 000 € net/mois et plus",
      "debouches": ["Cabinet d'avocats", "Entreprise (juriste)", "Secteur public"],
      "tendance": "Stable, spécialisations en droit du numérique en croissance"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/avocat"
  },
  {
    "id": "comptable",
    "nom": "Comptable / Expert-comptable",
    "description": "Gère les comptes d'une entreprise, établit les bilans, déclarations fiscales et conseille sur la gestion.",
    "riasec": ["C", "I", "E"],
    "etudes": {
      "diplome": "BTS Comptabilité Gestion ou DCG / DSCG (Expert-comptable)",
      "duree": "2 ans (BTS) à 8 ans (Expert-comptable)",
      "acces": "Parcoursup — BTS CG ou IUT GEA",
      "bacs_conseilles": ["Bac général (Maths)", "Bac STMG"]
    },
    "marche": {
      "salaire_debutant": "1 700 € net/mois",
      "salaire_experimente": "3 500 € net/mois (expert-comptable associé : plus)",
      "debouches": ["Cabinet comptable", "Entreprise", "Administration", "Libéral"],
      "tendance": "Stable et sécurisé, toujours en demande"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/expert-comptable"
  },
  {
    "id": "pharmacien",
    "nom": "Pharmacien",
    "description": "Délivre les médicaments, conseille les patients et assure la sécurité des traitements.",
    "riasec": ["I", "S", "C"],
    "etudes": {
      "diplome": "Diplôme d'État de Docteur en Pharmacie",
      "duree": "6 ans minimum après le bac",
      "acces": "Parcoursup — PASS ou L.AS",
      "bacs_conseilles": ["Bac général (SVT + Chimie + Maths indispensables)"]
    },
    "marche": {
      "salaire_debutant": "2 200 € net/mois",
      "salaire_experimente": "5 000 € net/mois (titulaire officine)",
      "debouches": ["Officine", "Hôpital", "Industrie pharmaceutique", "Recherche"],
      "tendance": "Stable, officines en légère baisse, industrie en hausse"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/pharmacien"
  },
  {
    "id": "chef-de-projet",
    "nom": "Chef de projet / Manager",
    "description": "Pilote des projets de A à Z : planning, budget, équipe, livraison. Présent dans tous les secteurs.",
    "riasec": ["E", "C", "S"],
    "etudes": {
      "diplome": "Master Management de projet ou école de commerce/ingénieur",
      "duree": "5 ans après le bac",
      "acces": "Parcoursup — Licence puis Master, ou école de commerce post-bac",
      "bacs_conseilles": ["Bac général"]
    },
    "marche": {
      "salaire_debutant": "2 500 € net/mois",
      "salaire_experimente": "4 500 € net/mois",
      "debouches": ["IT", "BTP", "Marketing", "Industrie", "Événementiel"],
      "tendance": "Transversal à tous les secteurs, très porteur"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/chef-de-projet"
  },
  {
    "id": "educateur-specialise",
    "nom": "Éducateur spécialisé",
    "description": "Accompagne des personnes en difficulté sociale (enfants, adultes handicapés, personnes en exclusion).",
    "riasec": ["S", "E", "A"],
    "etudes": {
      "diplome": "Diplôme d'État d'Éducateur Spécialisé (DEES)",
      "duree": "3 ans après le bac",
      "acces": "Parcoursup — IRTS ou EFTS (Institut de Formation Travail Social)",
      "bacs_conseilles": ["Bac général", "Bac STSS"]
    },
    "marche": {
      "salaire_debutant": "1 700 € net/mois",
      "salaire_experimente": "2 200 € net/mois",
      "debouches": ["Protection enfance", "Handicap", "Insertion", "Justice", "EHPAD"],
      "tendance": "Fort besoin, secteur peu rémunérateur mais porteur de sens"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/educateur-specialise"
  },
  {
    "id": "mecanicien-automobile",
    "nom": "Mécanicien automobile",
    "description": "Diagnostique les pannes et effectue l'entretien et la réparation des véhicules.",
    "riasec": ["R", "I"],
    "etudes": {
      "diplome": "CAP Maintenance des Véhicules ou Bac Pro MV",
      "duree": "2 à 3 ans après le collège",
      "acces": "Parcoursup ou apprentissage",
      "bacs_conseilles": ["Bac Pro Maintenance des Véhicules", "CAP"]
    },
    "marche": {
      "salaire_debutant": "1 600 € net/mois",
      "salaire_experimente": "2 200 € net/mois (chef d'atelier)",
      "debouches": ["Concession automobile", "Garage indépendant", "Transport"],
      "tendance": "Pénurie de candidats, transition électrique crée de nouveaux besoins"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/mecanicien-auto"
  },
  {
    "id": "chercheur",
    "nom": "Chercheur scientifique",
    "description": "Mène des travaux de recherche fondamentale ou appliquée pour faire avancer les connaissances.",
    "riasec": ["I", "A", "R"],
    "etudes": {
      "diplome": "Doctorat (bac+8)",
      "duree": "8 ans après le bac (Licence + Master + Thèse)",
      "acces": "Parcoursup — Licence dans la discipline choisie",
      "bacs_conseilles": ["Bac général (Maths + SVT ou Physique selon spécialité)"]
    },
    "marche": {
      "salaire_debutant": "2 000 € net/mois (post-doc)",
      "salaire_experimente": "3 500 € net/mois (directeur de recherche)",
      "debouches": ["CNRS", "INSERM", "Universités", "Industrie R&D", "Biotech"],
      "tendance": "Compétitif pour les postes publics, industrie recrute bien"
    },
    "lien_onisep": "https://www.onisep.fr/ressources/univers-metier/metiers/chercheur"
  }
]
```

- [ ] **Étape 2 : Commit**

```bash
git add src/data/metiers.json
git commit -m "feat: 20 fiches métiers MVP (ONISEP/ROME)"
```

---

## Task 5 : Logique RIASEC + tests

**Files:**
- Create: `src/lib/riasec.ts`, `src/lib/__tests__/riasec.test.ts`

- [ ] **Étape 1 : Écrire le test en premier**

Créer `src/lib/__tests__/riasec.test.ts` :

```typescript
import { calculerScores, determinerProfil, suggererMetiers, traiterQuiz } from '../riasec'

describe('calculerScores', () => {
  it('retourne des scores à zéro si aucune réponse', () => {
    expect(calculerScores({})).toEqual({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 })
  })

  it('accumule correctement les scores par type RIASEC', () => {
    // Questions 1-5 sont de type R
    const reponses: Record<number, number> = { 1: 5, 2: 4, 3: 3, 4: 2, 5: 1 }
    const scores = calculerScores(reponses)
    expect(scores.R).toBe(15)
    expect(scores.I).toBe(0)
  })

  it('ignore les questions non répondues', () => {
    const reponses: Record<number, number> = { 1: 5 }
    const scores = calculerScores(reponses)
    expect(scores.R).toBe(5)
  })
})

describe('determinerProfil', () => {
  it('retourne les 3 types avec les scores les plus élevés dans le bon ordre', () => {
    const scores = { R: 20, I: 15, A: 25, S: 10, E: 18, C: 5 }
    expect(determinerProfil(scores)).toEqual(['A', 'R', 'E'])
  })

  it('retourne exactement 3 types', () => {
    const scores = { R: 5, I: 10, A: 15, S: 20, E: 25, C: 3 }
    expect(determinerProfil(scores)).toHaveLength(3)
  })
})

describe('suggererMetiers', () => {
  it('retourne au maximum 10 métiers', () => {
    expect(suggererMetiers(['S', 'I', 'A'])).toHaveLength(expect.any(Number))
    expect(suggererMetiers(['S', 'I', 'A']).length).toBeLessThanOrEqual(10)
  })

  it('retourne uniquement des métiers correspondant au profil', () => {
    const metiers = suggererMetiers(['S', 'I', 'A'])
    expect(metiers.every(m => m.riasec.includes('S') || m.riasec.includes('I'))).toBe(true)
  })

  it('trie les métiers par pertinence (plus de types en commun = priorité)', () => {
    const metiers = suggererMetiers(['S', 'I', 'A'])
    if (metiers.length >= 2) {
      const score0 = metiers[0].riasec.filter(t => ['S', 'I', 'A'].includes(t)).length
      const scoreLast = metiers[metiers.length - 1].riasec.filter(t => ['S', 'I', 'A'].includes(t)).length
      expect(score0).toBeGreaterThanOrEqual(scoreLast)
    }
  })
})

describe('traiterQuiz', () => {
  it('retourne un résultat complet avec scores, profil et métiers', () => {
    const reponses: Record<number, number> = {}
    // Répondre 5 à toutes les questions Sociales (16-20)
    for (let i = 16; i <= 20; i++) reponses[i] = 5
    const result = traiterQuiz(reponses)
    expect(result).toHaveProperty('scores')
    expect(result).toHaveProperty('profil')
    expect(result).toHaveProperty('metiers')
    expect(result.profil[0]).toBe('S')
  })
})
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

```bash
npm test -- src/lib/__tests__/riasec.test.ts
```

Attendu : FAIL — "Cannot find module '../riasec'"

- [ ] **Étape 3 : Implémenter `src/lib/riasec.ts`**

```typescript
import type { RiasecScores, RiasecType, QuizResult, Metier } from './types'
import questionsData from '../data/quiz-questions.json'
import metiersData from '../data/metiers.json'

const questions = questionsData as Array<{ id: number; texte: string; type: RiasecType }>
const metiers = metiersData as Metier[]

export function calculerScores(reponses: Record<number, number>): RiasecScores {
  const scores: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
  for (const q of questions) {
    scores[q.type] += reponses[q.id] ?? 0
  }
  return scores
}

export function determinerProfil(scores: RiasecScores): RiasecType[] {
  return (Object.entries(scores) as [RiasecType, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type]) => type)
}

export function suggererMetiers(profil: RiasecType[]): Metier[] {
  const [type1, type2] = profil
  return metiers
    .filter(m => m.riasec.includes(type1) || m.riasec.includes(type2))
    .sort((a, b) => {
      const scoreA = a.riasec.filter(t => profil.includes(t)).length
      const scoreB = b.riasec.filter(t => profil.includes(t)).length
      return scoreB - scoreA
    })
    .slice(0, 10)
}

export function traiterQuiz(reponses: Record<number, number>): QuizResult {
  const scores = calculerScores(reponses)
  const profil = determinerProfil(scores)
  return { scores, profil, metiers: suggererMetiers(profil) }
}
```

- [ ] **Étape 4 : Lancer les tests pour vérifier qu'ils passent**

```bash
npm test -- src/lib/__tests__/riasec.test.ts
```

Attendu : PASS (tous les tests verts)

- [ ] **Étape 5 : Commit**

```bash
git add src/lib/riasec.ts src/lib/__tests__/riasec.test.ts
git commit -m "feat: logique RIASEC avec tests (scoring + suggestions métiers)"
```

---

## Task 6 : Data loader + system prompt

**Files:**
- Create: `src/lib/data-loader.ts`, `src/lib/system-prompt.ts`, `src/lib/__tests__/data-loader.test.ts`

- [ ] **Étape 1 : Écrire le test**

Créer `src/lib/__tests__/data-loader.test.ts` :

```typescript
import { rechercherMetiers, getMetierById } from '../data-loader'

describe('rechercherMetiers', () => {
  it('retourne des résultats pour un terme connu', () => {
    const resultats = rechercherMetiers('infirmier')
    expect(resultats.length).toBeGreaterThan(0)
    expect(resultats[0].nom.toLowerCase()).toContain('infirmier')
  })

  it('retourne un tableau vide si aucune correspondance', () => {
    expect(rechercherMetiers('xyzabc123inexistant')).toHaveLength(0)
  })

  it('est insensible à la casse', () => {
    expect(rechercherMetiers('INFIRMIER').length).toBeGreaterThan(0)
  })
})

describe('getMetierById', () => {
  it('retourne le métier correspondant à l\'id', () => {
    const metier = getMetierById('infirmier')
    expect(metier).not.toBeNull()
    expect(metier?.id).toBe('infirmier')
  })

  it('retourne null pour un id inconnu', () => {
    expect(getMetierById('id-qui-nexiste-pas')).toBeNull()
  })
})
```

- [ ] **Étape 2 : Vérifier que le test échoue**

```bash
npm test -- src/lib/__tests__/data-loader.test.ts
```

Attendu : FAIL

- [ ] **Étape 3 : Implémenter `src/lib/data-loader.ts`**

```typescript
import type { Metier } from './types'
import metiersData from '../data/metiers.json'

const metiers = metiersData as Metier[]

export function rechercherMetiers(query: string): Metier[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return metiers.filter(m =>
    m.nom.toLowerCase().includes(q) ||
    m.description.toLowerCase().includes(q) ||
    m.etudes.diplome.toLowerCase().includes(q) ||
    m.marche.debouches.some(d => d.toLowerCase().includes(q))
  )
}

export function getMetierById(id: string): Metier | null {
  return metiers.find(m => m.id === id) ?? null
}

export function getContextForQuery(query: string): string {
  const resultats = rechercherMetiers(query)
  if (resultats.length === 0) return ''
  return resultats
    .slice(0, 3)
    .map(m => `
Métier : ${m.nom}
Description : ${m.description}
Études : ${m.etudes.diplome} — ${m.etudes.duree} — Accès : ${m.etudes.acces}
Bacs conseillés : ${m.etudes.bacs_conseilles.join(', ')}
Salaire débutant : ${m.marche.salaire_debutant} / Expérimenté : ${m.marche.salaire_experimente}
Débouchés : ${m.marche.debouches.join(', ')}
Tendance : ${m.marche.tendance}
    `.trim())
    .join('\n\n---\n\n')
}
```

- [ ] **Étape 4 : Créer `src/lib/system-prompt.ts`**

```typescript
export function buildSystemPrompt(context: string): string {
  const contextSection = context
    ? `\nContexte disponible sur les métiers :\n${context}\n`
    : ''

  return `Tu es Atlas-IA, un conseiller d'orientation professionnelle bienveillant et expert du système éducatif français. Tu aides principalement les lycéens (15-18 ans) à découvrir leur voie professionnelle.

Tes règles absolues :
- Réponds TOUJOURS en français
- Sois bienveillant, encourageant et jamais condescendant
- Donne des informations concrètes : durée des études, accès Parcoursup/BTS/IUT, salaires
- Reste focalisé sur l'orientation professionnelle — décline poliment les autres sujets
- Si tu n'as pas l'information, dis-le clairement plutôt qu'inventer
- Limite tes réponses à 250 mots maximum pour rester lisible sur mobile
- Utilise le contexte fourni en priorité pour tes réponses
${contextSection}`
}
```

- [ ] **Étape 5 : Lancer les tests**

```bash
npm test -- src/lib/__tests__/data-loader.test.ts
```

Attendu : PASS

- [ ] **Étape 6 : Commit**

```bash
git add src/lib/data-loader.ts src/lib/system-prompt.ts src/lib/__tests__/data-loader.test.ts
git commit -m "feat: data loader + system prompt orientation"
```

---

## Task 7 : API Routes (Groq)

**Files:**
- Create: `src/app/api/chat/route.ts`, `src/app/api/quiz/route.ts`

- [ ] **Étape 1 : Créer `src/app/api/chat/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { getContextForQuery } from '@/lib/data-loader'
import { buildSystemPrompt } from '@/lib/system-prompt'
import type { Message } from '@/lib/types'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { messages, dernierMessage } = await req.json() as {
    messages: Message[]
    dernierMessage: string
  }

  const context = getContextForQuery(dernierMessage)
  const systemPrompt = buildSystemPrompt(context)

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: 600,
    temperature: 0.7,
  })

  const reponse = completion.choices[0].message.content ?? ''
  return NextResponse.json({ reponse })
}
```

- [ ] **Étape 2 : Créer `src/app/api/quiz/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { traiterQuiz } from '@/lib/riasec'

export async function POST(req: NextRequest) {
  const { reponses } = await req.json() as { reponses: Record<number, number> }
  const resultat = traiterQuiz(reponses)
  return NextResponse.json(resultat)
}
```

- [ ] **Étape 3 : Tester manuellement l'API chat**

Démarrer le serveur :
```bash
npm run dev
```

Dans un nouveau terminal :
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[],"dernierMessage":"Quelles études pour devenir infirmier ?"}'
```

Attendu : JSON avec une clé `reponse` contenant une réponse en français sur les études infirmières.

- [ ] **Étape 4 : Commit**

```bash
git add src/app/api/
git commit -m "feat: API routes chat (Groq) et quiz (RIASEC)"
```

---

## Task 8 : Layout global + Header + Footer

**Files:**
- Create: `src/app/layout.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`

- [ ] **Étape 1 : Créer `src/components/layout/Header.tsx`**

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl font-semibold text-stone-800">
          Atlas-IA
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/orientation">Commencer</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/a-propos">À propos</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
```

- [ ] **Étape 2 : Créer `src/components/layout/Footer.tsx`**

```typescript
export function Footer() {
  return (
    <footer className="border-t border-stone-200 py-8 mt-auto">
      <div className="max-w-5xl mx-auto px-4 text-center text-sm text-stone-500">
        <p>Atlas-IA — Données issues de l'ONISEP et France Travail (ROME)</p>
        <p className="mt-1">Aucune donnée personnelle collectée · Traitement 100% local</p>
      </div>
    </footer>
  )
}
```

- [ ] **Étape 3 : Modifier `src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import { Instrument_Serif, Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-serif',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Atlas-IA — Trouve ta voie',
  description: 'Conseiller d\'orientation IA gratuit pour lycéens et adultes en reconversion. Quiz RIASEC et chat personnalisé.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${instrumentSerif.variable} ${inter.variable} font-sans bg-stone-50 min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Étape 4 : Vérifier visuellement sur http://localhost:3000**

Attendu : Header avec "Atlas-IA" + boutons, fond pierre clair, Footer en bas.

- [ ] **Étape 5 : Commit**

```bash
git add src/app/layout.tsx src/components/layout/
git commit -m "feat: layout global avec Header et Footer"
```

---

## Task 9 : Landing page

**Files:**
- Create: `src/app/page.tsx`

- [ ] **Étape 1 : Créer `src/app/page.tsx`**

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Hero */}
      <section className="text-center mb-20">
        <p className="text-sm font-medium text-emerald-700 uppercase tracking-widest mb-4">
          Orientation professionnelle
        </p>
        <h1 className="font-serif text-5xl md:text-6xl text-stone-900 leading-tight mb-6">
          Trouve ta voie<br />avec l'intelligence artificielle
        </h1>
        <p className="text-lg text-stone-600 max-w-xl mx-auto mb-8">
          Atlas-IA t'aide à découvrir les métiers qui correspondent vraiment à ta personnalité.
          Quiz RIASEC et chat personnalisé — entièrement gratuit.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="bg-stone-900 hover:bg-stone-700 text-white" asChild>
            <Link href="/orientation/quiz">Faire le quiz RIASEC</Link>
          </Button>
          <Button size="lg" variant="outline" className="border-stone-300" asChild>
            <Link href="/orientation/chat">Poser une question</Link>
          </Button>
        </div>
      </section>

      {/* 3 arguments */}
      <section className="grid md:grid-cols-3 gap-6 mb-20">
        {[
          {
            titre: 'Quiz RIASEC',
            texte: '30 questions pour identifier ta personnalité professionnelle et découvrir les métiers qui te correspondent.',
          },
          {
            titre: 'Chat libre',
            texte: 'Pose toutes tes questions sur les études, les salaires, les débouchés. L\'IA répond 24h/24.',
          },
          {
            titre: 'Données officielles',
            texte: 'Toutes les informations viennent de l\'ONISEP et de France Travail. Fiables et à jour.',
          },
        ].map((item) => (
          <Card key={item.titre} className="border-stone-200 bg-white">
            <CardContent className="pt-6">
              <h3 className="font-serif text-xl text-stone-900 mb-2">{item.titre}</h3>
              <p className="text-stone-600 text-sm leading-relaxed">{item.texte}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* CTA secondaire */}
      <section className="text-center">
        <p className="text-stone-500 text-sm">
          Aucune inscription requise · Aucune donnée personnelle collectée
        </p>
      </section>
    </div>
  )
}
```

- [ ] **Étape 2 : Vérifier sur http://localhost:3000**

Attendu : Landing page avec hero, 3 cards, boutons fonctionnels.

- [ ] **Étape 3 : Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: landing page Atlas-IA"
```

---

## Task 10 : Hub orientation + page À propos

**Files:**
- Create: `src/app/orientation/page.tsx`, `src/app/a-propos/page.tsx`

- [ ] **Étape 1 : Créer `src/app/orientation/page.tsx`**

```typescript
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function OrientationPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="font-serif text-4xl text-stone-900 mb-4 text-center">
        Par où commencer ?
      </h1>
      <p className="text-stone-600 text-center mb-12">
        Deux façons de trouver ta voie avec Atlas-IA.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-stone-200 bg-white hover:border-emerald-300 transition-colors">
          <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-2xl">
              🎯
            </div>
            <div>
              <h2 className="font-serif text-2xl text-stone-900 mb-2">Quiz RIASEC</h2>
              <p className="text-stone-600 text-sm mb-4">
                30 questions · 8 min · Profil complet avec métiers adaptés
              </p>
            </div>
            <Button className="bg-stone-900 hover:bg-stone-700 text-white w-full" asChild>
              <Link href="/orientation/quiz">Commencer le quiz</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white hover:border-emerald-300 transition-colors">
          <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-2xl">
              💬
            </div>
            <div>
              <h2 className="font-serif text-2xl text-stone-900 mb-2">Chat libre</h2>
              <p className="text-stone-600 text-sm mb-4">
                Pose tes questions · Réponses instantanées · Sources officielles
              </p>
            </div>
            <Button variant="outline" className="border-stone-300 w-full" asChild>
              <Link href="/orientation/chat">Ouvrir le chat</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Étape 2 : Créer `src/app/a-propos/page.tsx`**

```typescript
export default function AProposPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="font-serif text-4xl text-stone-900 mb-8">À propos d'Atlas-IA</h1>

      <div className="prose prose-stone max-w-none space-y-6 text-stone-700">
        <p>
          Atlas-IA est un conseiller d'orientation gratuit, construit pour aider les lycéens
          et les adultes en reconversion à trouver leur voie professionnelle.
        </p>

        <h2 className="font-serif text-2xl text-stone-900 mt-8">Sources des données</h2>
        <ul className="space-y-2">
          <li><strong>ONISEP</strong> — Fiches métiers et formations officielles françaises</li>
          <li><strong>France Travail (ROME v4)</strong> — Référentiel des métiers, compétences et salaires</li>
          <li><strong>Modèle Holland RIASEC</strong> — Standard mondial de l'orientation professionnelle</li>
        </ul>

        <h2 className="font-serif text-2xl text-stone-900 mt-8">Vie privée</h2>
        <p>
          Atlas-IA ne collecte aucune donnée personnelle. Tes conversations ne sont pas
          enregistrées ni transmises à des tiers. Aucune inscription requise.
        </p>

        <h2 className="font-serif text-2xl text-stone-900 mt-8">Intelligence artificielle</h2>
        <p>
          L'IA est alimentée par Llama 3.1, un modèle de langage open source.
          Les réponses sont basées sur des données officielles mais peuvent contenir
          des imprécisions — consulte toujours un conseiller d'orientation pour les décisions importantes.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Étape 3 : Commit**

```bash
git add src/app/orientation/page.tsx src/app/a-propos/page.tsx
git commit -m "feat: hub orientation et page à propos"
```

---

## Task 11 : Interface Chat

**Files:**
- Create: `src/components/chat/MessageBubble.tsx`, `src/components/chat/ChatInput.tsx`, `src/components/chat/ChatInterface.tsx`, `src/app/orientation/chat/page.tsx`

- [ ] **Étape 1 : Créer `src/components/chat/MessageBubble.tsx`**

```typescript
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-stone-900 text-white rounded-br-sm'
          : 'bg-white border border-stone-200 text-stone-800 rounded-bl-sm'
      )}>
        {message.content}
      </div>
    </div>
  )
}
```

- [ ] **Étape 2 : Créer `src/components/chat/ChatInput.tsx`**

```typescript
'use client'
import { useState, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ChatInputProps {
  onEnvoi: (message: string) => void
  disabled: boolean
}

export function ChatInput({ onEnvoi, disabled }: ChatInputProps) {
  const [valeur, setValeur] = useState('')

  const envoyer = () => {
    const msg = valeur.trim()
    if (!msg || disabled) return
    onEnvoi(msg)
    setValeur('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      envoyer()
    }
  }

  return (
    <div className="flex gap-2 p-4 border-t border-stone-200 bg-white">
      <Input
        value={valeur}
        onChange={e => setValeur(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Pose ta question sur les métiers, les études..."
        disabled={disabled}
        className="flex-1 border-stone-200"
      />
      <Button
        onClick={envoyer}
        disabled={disabled || !valeur.trim()}
        className="bg-stone-900 hover:bg-stone-700 text-white"
      >
        Envoyer
      </Button>
    </div>
  )
}
```

- [ ] **Étape 3 : Créer `src/components/chat/ChatInterface.tsx`**

```typescript
'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import type { Message } from '@/lib/types'

const MESSAGE_BIENVENUE: Message = {
  role: 'assistant',
  content: 'Bonjour ! Je suis Atlas-IA, ton conseiller d\'orientation. Pose-moi toutes tes questions sur les métiers, les études ou l\'orientation professionnelle. Je suis là pour t\'aider !'
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([MESSAGE_BIENVENUE])
  const [chargement, setChargement] = useState(false)
  const basRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    basRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const envoyerMessage = async (contenu: string) => {
    const userMsg: Message = { role: 'user', content: contenu }
    const nouveauxMessages = [...messages, userMsg]
    setMessages(nouveauxMessages)
    setChargement(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nouveauxMessages.slice(1), // sans le message de bienvenue
          dernierMessage: contenu,
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reponse }])
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
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
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

- [ ] **Étape 4 : Créer `src/app/orientation/chat/page.tsx`**

```typescript
import { ChatInterface } from '@/components/chat/ChatInterface'

export const metadata = {
  title: 'Chat orientation — Atlas-IA',
}

export default function ChatPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-6">
      <h1 className="font-serif text-2xl text-stone-900 mb-1">Chat orientation</h1>
      <p className="text-stone-500 text-sm mb-4">
        Pose toutes tes questions sur les métiers et les études
      </p>
      <ChatInterface />
    </div>
  )
}
```

- [ ] **Étape 5 : Tester le chat sur http://localhost:3000/orientation/chat**

Envoyer "Quelles études pour devenir infirmier ?" — attendu : réponse d'Atlas-IA en moins de 3 secondes.

- [ ] **Étape 6 : Commit**

```bash
git add src/components/chat/ src/app/orientation/chat/
git commit -m "feat: interface chat avec Groq API"
```

---

## Task 12 : Quiz RIASEC

**Files:**
- Create: `src/app/orientation/quiz/useQuiz.ts`, `src/components/quiz/QuizQuestion.tsx`, `src/components/quiz/QuizProgress.tsx`, `src/app/orientation/quiz/page.tsx`

- [ ] **Étape 1 : Créer `src/app/orientation/quiz/useQuiz.ts`**

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import questionsData from '@/data/quiz-questions.json'
import type { QuizQuestion } from '@/lib/types'

const QUESTIONS = questionsData as QuizQuestion[]

export function useQuiz() {
  const [indexCourant, setIndexCourant] = useState(0)
  const [reponses, setReponses] = useState<Record<number, number>>({})
  const [chargement, setChargement] = useState(false)
  const router = useRouter()

  const question = QUESTIONS[indexCourant]
  const progression = ((indexCourant) / QUESTIONS.length) * 100
  const estDerniere = indexCourant === QUESTIONS.length - 1

  const repondre = async (valeur: number) => {
    const nouvellesReponses = { ...reponses, [question.id]: valeur }
    setReponses(nouvellesReponses)

    if (estDerniere) {
      setChargement(true)
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reponses: nouvellesReponses }),
      })
      const resultat = await res.json()
      sessionStorage.setItem('atlas-quiz-resultat', JSON.stringify(resultat))
      router.push('/orientation/profil')
    } else {
      setIndexCourant(i => i + 1)
    }
  }

  return { question, indexCourant, total: QUESTIONS.length, progression, repondre, chargement }
}
```

- [ ] **Étape 2 : Créer `src/components/quiz/QuizProgress.tsx`**

```typescript
import { Progress } from '@/components/ui/progress'

interface QuizProgressProps {
  indexCourant: number
  total: number
  progression: number
}

export function QuizProgress({ indexCourant, total, progression }: QuizProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-stone-500 mb-2">
        <span>Question {indexCourant + 1} sur {total}</span>
        <span>{Math.round(progression)}%</span>
      </div>
      <Progress value={progression} className="h-2" />
    </div>
  )
}
```

- [ ] **Étape 3 : Créer `src/components/quiz/QuizQuestion.tsx`**

```typescript
import { Button } from '@/components/ui/button'

const OPTIONS = [
  { valeur: 1, label: 'Pas du tout' },
  { valeur: 2, label: 'Un peu' },
  { valeur: 3, label: 'Moyennement' },
  { valeur: 4, label: 'Beaucoup' },
  { valeur: 5, label: 'Tout à fait' },
]

interface QuizQuestionProps {
  texte: string
  onReponse: (valeur: number) => void
  disabled: boolean
}

export function QuizQuestion({ texte, onReponse, disabled }: QuizQuestionProps) {
  return (
    <div>
      <p className="font-serif text-2xl text-stone-900 mb-8 leading-snug">{texte}</p>
      <div className="grid grid-cols-5 gap-2">
        {OPTIONS.map(opt => (
          <button
            key={opt.valeur}
            onClick={() => onReponse(opt.valeur)}
            disabled={disabled}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border border-stone-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span className="text-2xl font-semibold text-stone-700">{opt.valeur}</span>
            <span className="text-xs text-stone-500 text-center leading-tight">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Étape 4 : Créer `src/app/orientation/quiz/page.tsx`**

```typescript
'use client'
import { useQuiz } from './useQuiz'
import { QuizProgress } from '@/components/quiz/QuizProgress'
import { QuizQuestion } from '@/components/quiz/QuizQuestion'

export default function QuizPage() {
  const { question, indexCourant, total, progression, repondre, chargement } = useQuiz()

  if (chargement) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="font-serif text-2xl text-stone-700">Atlas-IA analyse ton profil...</p>
        <p className="text-stone-500 mt-2">Quelques secondes</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <QuizProgress indexCourant={indexCourant} total={total} progression={progression} />
      <QuizQuestion texte={question.texte} onReponse={repondre} disabled={chargement} />
      <p className="text-center text-xs text-stone-400 mt-8">
        Clique sur une valeur de 1 (pas du tout) à 5 (tout à fait)
      </p>
    </div>
  )
}
```

- [ ] **Étape 5 : Tester le quiz sur http://localhost:3000/orientation/quiz**

Répondre aux 30 questions — attendu : redirection vers /orientation/profil à la fin.

- [ ] **Étape 6 : Commit**

```bash
git add src/app/orientation/quiz/ src/components/quiz/QuizProgress.tsx src/components/quiz/QuizQuestion.tsx
git commit -m "feat: quiz RIASEC 30 questions avec progression"
```

---

## Task 13 : Page profil / résultats

**Files:**
- Create: `src/components/quiz/MetierCard.tsx`, `src/components/quiz/QuizResults.tsx`, `src/app/orientation/profil/page.tsx`

- [ ] **Étape 1 : Créer `src/components/quiz/MetierCard.tsx`**

```typescript
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Metier } from '@/lib/types'

export function MetierCard({ metier }: { metier: Metier }) {
  return (
    <Card className="border-stone-200 bg-white hover:border-emerald-300 transition-colors">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-serif text-lg text-stone-900 leading-tight">{metier.nom}</h3>
          <div className="flex gap-1 flex-shrink-0">
            {metier.riasec.map(t => (
              <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
            ))}
          </div>
        </div>
        <p className="text-stone-600 text-sm mb-3 leading-relaxed">{metier.description}</p>
        <div className="space-y-1 text-xs text-stone-500">
          <p>📚 {metier.etudes.diplome} — {metier.etudes.duree}</p>
          <p>💶 Débutant : {metier.marche.salaire_debutant}</p>
          <p>📈 {metier.marche.tendance}</p>
        </div>
        <a
          href={metier.lien_onisep}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs text-emerald-700 hover:underline"
        >
          Fiche ONISEP complète →
        </a>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Étape 2 : Créer `src/app/orientation/profil/page.tsx`**

```typescript
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MetierCard } from '@/components/quiz/MetierCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import descriptionsData from '@/data/riasec-descriptions.json'
import type { QuizResult, RiasecDescription } from '@/lib/types'
import Link from 'next/link'

const descriptions = descriptionsData as RiasecDescription[]

export default function ProfilPage() {
  const [resultat, setResultat] = useState<QuizResult | null>(null)
  const router = useRouter()

  useEffect(() => {
    const data = sessionStorage.getItem('atlas-quiz-resultat')
    if (!data) {
      router.push('/orientation/quiz')
      return
    }
    setResultat(JSON.parse(data))
  }, [router])

  if (!resultat) return null

  const descriptionsProfil = resultat.profil
    .map(type => descriptions.find(d => d.type === type))
    .filter(Boolean) as RiasecDescription[]

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <p className="text-sm text-emerald-700 font-medium uppercase tracking-widest mb-2">
        Ton profil RIASEC
      </p>
      <h1 className="font-serif text-4xl text-stone-900 mb-6">
        {descriptionsProfil.map(d => d.label).join(' · ')}
      </h1>

      {/* Types RIASEC */}
      <div className="grid gap-4 mb-10">
        {descriptionsProfil.map(d => (
          <div key={d.type} className="flex gap-4 p-4 bg-white border border-stone-200 rounded-xl">
            <Badge className="h-fit mt-1">{d.type}</Badge>
            <div>
              <p className="font-medium text-stone-900 mb-1">{d.label}</p>
              <p className="text-stone-600 text-sm">{d.description}</p>
              <p className="text-xs text-stone-400 mt-1">{d.mots_cles.join(' · ')}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Métiers suggérés */}
      <h2 className="font-serif text-2xl text-stone-900 mb-4">
        Métiers qui te correspondent
      </h2>
      <div className="grid gap-4 mb-10">
        {resultat.metiers.map(m => (
          <MetierCard key={m.id} metier={m} />
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="bg-stone-900 hover:bg-stone-700 text-white" asChild>
          <Link href="/orientation/chat">Explorer avec le chat →</Link>
        </Button>
        <Button variant="outline" className="border-stone-300" asChild>
          <Link href="/orientation/quiz">Refaire le quiz</Link>
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Étape 3 : Faire le quiz complet en test**

Aller sur http://localhost:3000/orientation/quiz, répondre aux 30 questions et vérifier que la page profil s'affiche avec les métiers correspondants.

- [ ] **Étape 4 : Commit**

```bash
git add src/components/quiz/MetierCard.tsx src/app/orientation/profil/
git commit -m "feat: page profil avec résultats RIASEC et métiers suggérés"
```

---

## Task 14 : Build final + déploiement Vercel

**Files:**
- Modify: aucun fichier source — vérification et déploiement uniquement

- [ ] **Étape 1 : Lancer tous les tests**

```bash
npm test
```

Attendu : tous les tests PASS (riasec.test.ts, data-loader.test.ts)

- [ ] **Étape 2 : Vérifier le build de production**

```bash
npm run build
```

Attendu : compilation sans erreur TypeScript ni warnings critiques.

- [ ] **Étape 3 : Créer un repo GitHub**

```bash
gh repo create atlas-ia --public --source=. --remote=origin --push
```

Si `gh` n'est pas installé : créer le repo manuellement sur github.com, puis :

```bash
git remote add origin https://github.com/TON_USERNAME/atlas-ia.git
git push -u origin main
```

- [ ] **Étape 4 : Déployer sur Vercel**

Aller sur https://vercel.com/new → importer le repo `atlas-ia`.

Dans les paramètres du projet Vercel, ajouter la variable d'environnement :
- Nom : `GROQ_API_KEY`
- Valeur : ta clé Groq (depuis console.groq.com)

Cliquer Deploy.

- [ ] **Étape 5 : Tester le déploiement en production**

Ouvrir l'URL Vercel fournie et tester :
1. Chat : envoyer "Quelles études pour devenir médecin ?"
2. Quiz : faire les 30 questions jusqu'à la page profil

- [ ] **Étape 6 : Commit final**

```bash
git add .
git commit -m "feat: Atlas-IA Phase 1 MVP — chat orientation + quiz RIASEC"
git push
```

---

## Checklist de couverture spec

| Exigence spec | Task couvrant |
|--------------|---------------|
| Chat libre | Task 11 |
| Quiz RIASEC 30 questions | Tasks 3, 12 |
| Page profil + 8-10 métiers | Task 13 |
| Données ONISEP/ROME | Task 4 |
| Groq API Phase 1 | Task 7 |
| Layout + landing | Tasks 8, 9 |
| Hub orientation | Task 10 |
| Page à propos | Task 10 |
| Deploy Vercel | Task 14 |
| Tests unitaires | Tasks 5, 6 |
