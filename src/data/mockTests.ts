import { TestItem } from '../types';

export const MOCK_TESTS: TestItem[] = [
  {
    id: 'neet-bio-full-mock-1',
    title: 'NEET 2026 Biology Grand Mock Test 1',
    category: 'NEET Full Syllabus',
    subject: 'Biology',
    totalQuestions: 90,
    durationMinutes: 60,
    totalMarks: 360,
    difficulty: 'Medium',
    attemptsCount: 7840,
    rating: 4.95,
    isPopular: true,
    description: 'Comprehensive NTA standard NEET mock test covering complete Class 11th & 12th Botany and Zoology strictly aligned with latest NCERT rationalized syllabus.',
    syllabus: [
      'Diversity in Living World & Plant Kingdom',
      'Structural Organisation in Animals and Plants',
      'Cell Biology & Biomolecules',
      'Plant Physiology & Human Physiology',
      'Genetics, Evolution & Molecular Biology',
      'Biotechnology & Ecology'
    ],
    questions: [
      {
        id: 1,
        question: 'Which of the following hormones is released by the beta-cells of the islets of Langerhans in the pancreas and stimulates glycogenesis in hepatocytes and adipocytes?',
        options: ['Glucagon', 'Insulin', 'Somatostatin', 'Epinephrine'],
        correctAnswer: 1,
        chapter: 'Chemical Coordination and Integration',
        ncertReference: 'Class 11 NCERT Biology, Chapter 19',
        explanation: 'Insulin is a peptide hormone secreted by the β-cells of the islets of Langerhans that acts on hepatocytes and adipocytes to enhance cellular glucose uptake and utilization.'
      },
      {
        id: 2,
        question: 'In DNA replication, the discontinuous Okazaki fragments synthesized on the lagging template strand are covalently joined together by the enzyme:',
        options: ['DNA Polymerase I', 'DNA Helicase', 'DNA Ligase', 'RNA Primase'],
        correctAnswer: 2,
        chapter: 'Molecular Basis of Inheritance',
        ncertReference: 'Class 12 NCERT Biology, Chapter 5',
        explanation: 'DNA Ligase catalyzes the formation of phosphodiester bonds to join the discontinuous Okazaki fragments synthesized on the lagging template strand.'
      },
      {
        id: 3,
        question: 'The site of light-dependent photochemical reactions and ATP/NADPH synthesis in chloroplasts is:',
        options: ['Stroma matrix', 'Thylakoid membrane and lumen', 'Outer membrane', 'Peroxisome'],
        correctAnswer: 1,
        chapter: 'Photosynthesis in Higher Plants',
        ncertReference: 'Class 11 NCERT Biology, Chapter 11',
        explanation: 'Light reaction or the photochemical phase occurs in the thylakoid membranes where chlorophyll pigments, Photosystem I, Photosystem II, and ATP synthase are embedded.'
      },
      {
        id: 4,
        question: 'A Mendelian monohybrid test cross between a heterozygous tall pea plant (Tt) and a homozygous recessive dwarf plant (tt) yields what phenotypic ratio?',
        options: ['1 : 1', '3 : 1', '9 : 3 : 3 : 1', '2 : 1'],
        correctAnswer: 0,
        chapter: 'Principles of Inheritance and Variation',
        ncertReference: 'Class 12 NCERT Biology, Chapter 4',
        explanation: 'A monohybrid test cross (Tt × tt) yields 50% Tall (Tt) and 50% Dwarf (tt), which gives the classic test-cross ratio of 1 : 1.'
      },
      {
        id: 5,
        question: 'Which thermostable DNA polymerase enzyme is widely used in Polymerase Chain Reaction (PCR) for in vitro DNA amplification?',
        options: ['RNA Polymerase II', 'Taq Polymerase', 'Reverse Transcriptase', 'DNA Topoisomerase'],
        correctAnswer: 1,
        chapter: 'Biotechnology: Principles and Processes',
        ncertReference: 'Class 12 NCERT Biology, Chapter 9',
        explanation: 'Taq polymerase is isolated from the thermophilic bacterium Thermus aquaticus and remains stable at high temperatures during the DNA denaturation step (94°C).'
      },
      {
        id: 6,
        question: 'Which of the following is an example of an ex-situ biodiversity conservation method?',
        options: ['National Park', 'Biosphere Reserve', 'Sacred Grove', 'Cryopreservation of gametes'],
        correctAnswer: 3,
        chapter: 'Biodiversity and Conservation',
        ncertReference: 'Class 12 NCERT Biology, Chapter 13',
        explanation: 'Cryopreservation of gametes in liquid nitrogen (-196°C), botanical gardens, and zoological parks are ex-situ methods where threatened organisms are kept outside their natural habitat.'
      },
      {
        id: 7,
        question: 'During skeletal muscle contraction, which zone or band shortens and may completely disappear?',
        options: ['A-band', 'H-zone', 'Myosin thick filament', 'M-line'],
        correctAnswer: 1,
        chapter: 'Locomotion and Movement',
        ncertReference: 'Class 11 NCERT Biology, Chapter 17',
        explanation: 'According to the Sliding Filament Theory, actin thin filaments slide into the center of the A-band, causing the H-zone (region of thick filament not overlapped by thin filament) to disappear.'
      },
      {
        id: 8,
        question: 'The anatomical structure that prevents the entry of food into the glottis during swallowing is:',
        options: ['Thyroid cartilage', 'Epiglottis', 'Cricoid cartilage', 'Uvula'],
        correctAnswer: 1,
        chapter: 'Breathing and Exchange of Gases',
        ncertReference: 'Class 11 NCERT Biology, Chapter 14',
        explanation: 'The epiglottis is a flexible cartilaginous flap situated at the opening of the larynx that covers the glottis during deglutition to prevent aspiration.'
      }
    ]
  },
  {
    id: 'neet-human-physio-master',
    title: 'Human Physiology NCERT Mastery Challenge',
    category: 'Class 11 Biology',
    subject: 'Biology',
    totalQuestions: 50,
    durationMinutes: 45,
    totalMarks: 200,
    difficulty: 'Hard',
    attemptsCount: 6840,
    rating: 4.96,
    isPopular: true,
    description: 'High-yield conceptual questions covering Digestion, Breathing & Gas Exchange, Body Fluids & Circulation, Excretory Products, Locomotion & Neural Coordination.',
    syllabus: [
      'Breathing and Exchange of Gases',
      'Body Fluids and Circulation',
      'Excretory Products and their Elimination',
      'Locomotion and Movement',
      'Neural Control and Chemical Coordination'
    ],
    questions: [
      {
        id: 1,
        question: 'Which valve prevents the backflow of oxygenated blood from the left ventricle into the left atrium during ventricular systole?',
        options: ['Tricuspid valve', 'Bicuspid (Mitral) valve', 'Aortic semilunar valve', 'Eustachian valve'],
        correctAnswer: 1,
        chapter: 'Body Fluids and Circulation',
        ncertReference: 'Class 11 NCERT Biology, Chapter 15',
        explanation: 'The bicuspid or mitral valve guards the opening between the left atrium and the left ventricle, preventing regurgitation into the atrium.'
      },
      {
        id: 2,
        question: 'In the human nephron, maximum reabsorption of water, electrolytes (70-80%), and essential nutrients occurs in the:',
        options: ['Proximal Convoluted Tubule (PCT)', 'Loop of Henle descending limb', 'Distal Convoluted Tubule (DCT)', 'Collecting Duct'],
        correctAnswer: 0,
        chapter: 'Excretory Products and their Elimination',
        ncertReference: 'Class 11 NCERT Biology, Chapter 16',
        explanation: 'PCT is lined by simple cuboidal brush border epithelium which drastically increases the surface area for reabsorption of nearly 70-80% electrolytes and water.'
      },
      {
        id: 3,
        question: 'The respiratory rhythm center responsible for basic rhythmic regulation of pulmonary ventilation is situated in the:',
        options: ['Pons varolii (Pneumotaxic center)', 'Medulla oblongata', 'Cerebellum', 'Corpus callosum'],
        correctAnswer: 1,
        chapter: 'Breathing and Exchange of Gases',
        ncertReference: 'Class 11 NCERT Biology, Chapter 14',
        explanation: 'A specialized center in the medulla oblongata called the respiratory rhythm center is primarily responsible for establishing respiratory cadence.'
      },
      {
        id: 4,
        question: 'Which ion plays the key role in binding to troponin C to uncover the active myosin-binding sites on actin filaments during muscle contraction?',
        options: ['Sodium (Na+)', 'Potassium (K+)', 'Calcium (Ca2+)', 'Magnesium (Mg2+)'],
        correctAnswer: 2,
        chapter: 'Locomotion and Movement',
        ncertReference: 'Class 11 NCERT Biology, Chapter 17',
        explanation: 'Calcium released from the sarcoplasmic reticulum binds to troponin C on the actin filaments, inducing a conformational shift that exposes active myosin binding sites.'
      },
      {
        id: 5,
        question: 'Resting membrane potential in a resting nerve fiber is maintained primarily by:',
        options: ['Voltage-gated Calcium channels', 'Sodium-Potassium ATPase pump (3 Na+ out, 2 K+ in)', 'Passive influx of chloride ions', 'Active efflux of magnesium'],
        correctAnswer: 1,
        chapter: 'Neural Control and Coordination',
        ncertReference: 'Class 11 NCERT Biology, Chapter 18',
        explanation: 'The Na+/K+ ATPase pump actively expels 3 Na+ ions outwards for every 2 K+ ions transported inwards into the axoplasm, maintaining electronegativity (-70 mV).'
      }
    ]
  },
  {
    id: 'neet-genetics-molecular-core',
    title: 'Genetics & Molecular Basis of Inheritance',
    category: 'Class 12 Biology',
    subject: 'Biology',
    totalQuestions: 60,
    durationMinutes: 50,
    totalMarks: 240,
    difficulty: 'Hard',
    attemptsCount: 5490,
    rating: 4.92,
    isPopular: true,
    description: 'Master Mendelian inheritance, chromosomal pedigrees, DNA replication forks, transcription, translation, and the Lac Operon model.',
    syllabus: [
      'Mendel’s Principles of Inheritance & Non-Mendelian Genetics',
      'Sex Determination & Chromosomal Disorders (Down, Turner, Klinefelter)',
      'Structure of DNA & Hershey-Chase Experiment',
      'Transcription, RNA Processing (Splicing, Capping, Tailing)',
      'Genetic Code, Translation & Lac Operon'
    ],
    questions: [
      {
        id: 1,
        question: 'Which of the following codons functions as the universal initiation codon for protein synthesis and codes for Methionine in eukaryotes?',
        options: ['UAA', 'UAG', 'AUG', 'UGA'],
        correctAnswer: 2,
        chapter: 'Molecular Basis of Inheritance',
        ncertReference: 'Class 12 NCERT Biology, Chapter 5',
        explanation: 'AUG has dual functions: it acts as the primary initiator codon on mRNA and codes for the amino acid Methionine (Formyl-methionine in prokaryotes).'
      },
      {
        id: 2,
        question: 'In the Lac Operon model of E. coli, which gene encodes the repressor protein that binds to the operator locus in the absence of lactose?',
        options: ['lac z gene', 'lac y gene', 'lac a gene', 'lac i gene'],
        correctAnswer: 3,
        chapter: 'Molecular Basis of Inheritance',
        ncertReference: 'Class 12 NCERT Biology, Chapter 5',
        explanation: 'The lac i gene (inhibitor gene) constitutively transcribes and translates the repressor protein that binds the operator locus in the absence of an inducer.'
      },
      {
        id: 3,
        question: 'A human female with karyotype 45 with X0 chromosomal complement suffers from which genetic disorder?',
        options: ['Down Syndrome', 'Turner Syndrome', 'Klinefelter Syndrome', 'Thalassemia'],
        correctAnswer: 1,
        chapter: 'Principles of Inheritance and Variation',
        ncertReference: 'Class 12 NCERT Biology, Chapter 4',
        explanation: 'Turner syndrome is caused by monosomy of the sex chromosomes (45, X0). Affected females have sterile rudimentary ovaries and webbed neck.'
      },
      {
        id: 4,
        question: 'The unequivocal proof that DNA is the genetic material was provided in 1952 by Hershey and Chase using radioactive isotopes:',
        options: ['14C and 15N', '32P (DNA) and 35S (Protein)', '3H and 14C', '36Cl and 40K'],
        correctAnswer: 1,
        chapter: 'Molecular Basis of Inheritance',
        ncertReference: 'Class 12 NCERT Biology, Chapter 5',
        explanation: 'Hershey and Chase grew bacteriophage T2 on radioactive phosphorus 32P (which labels DNA) and radioactive sulfur 35S (which labels the protein capsid).'
      }
    ]
  },
  {
    id: 'neet-cell-biomolecules-rev',
    title: 'Cell Biology, Cell Division & Biomolecules',
    category: 'Class 11 Biology',
    subject: 'Biology',
    totalQuestions: 45,
    durationMinutes: 40,
    totalMarks: 180,
    difficulty: 'Medium',
    attemptsCount: 4210,
    rating: 4.88,
    isNew: true,
    description: 'NCERT line-by-line questions covering Cell: The Unit of Life, Cell Cycle & Mitosis/Meiosis stages, Enzymes, and Biomolecular architecture.',
    syllabus: [
      'Prokaryotic vs Eukaryotic Cell Structure',
      'Endomembrane System, Mitochondria & Chloroplasts',
      'Stages of Meiosis I (Pachytene crossing over)',
      'Proteins, Carbohydrates, Lipids & Nucleic Acids',
      'Enzymatic Kinetics and Competitive Inhibition'
    ],
    questions: [
      {
        id: 1,
        question: 'Crossing over between non-sister chromatids of homologous chromosomes occurs during which sub-stage of Prophase I in Meiosis?',
        options: ['Leptotene', 'Zygotene', 'Pachytene', 'Diakinesis'],
        correctAnswer: 2,
        chapter: 'Cell Cycle and Cell Division',
        ncertReference: 'Class 11 NCERT Biology, Chapter 10',
        explanation: 'Crossing over mediated by the enzyme recombinase takes place in Pachytene stage between non-sister chromatids of bivalent homologous chromosomes.'
      },
      {
        id: 2,
        question: 'Malonate is a classic competitive inhibitor of the enzyme succinate dehydrogenase because it closely resembles:',
        options: ['Fumarate', 'Succinate substrate', 'Oxaloacetate', 'Citrate'],
        correctAnswer: 1,
        chapter: 'Biomolecules',
        ncertReference: 'Class 11 NCERT Biology, Chapter 9',
        explanation: 'Inhibition of succinic dehydrogenase by malonate which closely resembles the substrate succinate in structure is an example of competitive inhibition.'
      },
      {
        id: 3,
        question: 'Which of the following cellular structures lacks a surrounding lipid bilayer membrane?',
        options: ['Lysosome', 'Ribosome', 'Peroxisome', 'Vacuole (Tonoplast)'],
        correctAnswer: 1,
        chapter: 'Cell: The Unit of Life',
        ncertReference: 'Class 11 NCERT Biology, Chapter 8',
        explanation: 'Ribosomes and centrioles are non-membrane bound organelles found in both eukaryotic and prokaryotic cells.'
      }
    ]
  },
  {
    id: 'neet-ecology-environment-spec',
    title: 'Ecology, Environment & Biodiversity Test',
    category: 'High Yield',
    subject: 'Biology',
    totalQuestions: 40,
    durationMinutes: 35,
    totalMarks: 160,
    difficulty: 'Easy',
    attemptsCount: 3950,
    rating: 4.91,
    isPopular: true,
    description: 'High-scoring NEET unit covering Organisms & Populations, Ecosystem dynamics, Energy pyramids, and Global Environmental conservation.',
    syllabus: [
      'Organisms and Populations (Adaptations, Population interactions)',
      'Ecosystem (Productivity, Decomposition, Energy Flow)',
      'Biodiversity and its Conservation (Hotspots, In-situ vs Ex-situ)'
    ],
    questions: [
      {
        id: 1,
        question: 'Which ecological pyramid is ALWAYS strictly upright and can NEVER be inverted in any natural ecosystem?',
        options: ['Pyramid of Biomass in an aquatic ecosystem', 'Pyramid of Numbers in a tree ecosystem', 'Pyramid of Energy', 'Pyramid of Biomass in a grassland'],
        correctAnswer: 2,
        chapter: 'Ecosystem',
        ncertReference: 'Class 12 NCERT Biology, Chapter 12',
        explanation: 'Pyramid of energy is always upright because when energy flows from one trophic level to the next, 90% is dissipated as heat according to Lindeman 10% law.'
      },
      {
        id: 2,
        question: 'The symbiotic association between fungi and the roots of higher plants (gymnosperms/angiosperms) is known as:',
        options: ['Lichen', 'Mycorrhiza', 'Amensalism', 'Commensalism'],
        correctAnswer: 1,
        chapter: 'Organisms and Populations',
        ncertReference: 'Class 12 NCERT Biology, Chapter 11',
        explanation: 'Mycorrhiza is a mutualistic symbiotic association between fungal hyphae and root systems of plants (e.g. Pinus requires mycorrhizae for seed germination).'
      },
      {
        id: 3,
        question: 'According to Robert May’s global estimates, the total number of species on Earth is approximately:',
        options: ['1.5 million', '7 million', '20 to 50 million', '100 million'],
        correctAnswer: 1,
        chapter: 'Biodiversity and Conservation',
        ncertReference: 'Class 12 NCERT Biology, Chapter 13',
        explanation: 'Robert May places the global species diversity at approximately 7 million based on statistically sound estimates.'
      }
    ]
  },
  {
    id: 'jee-iat-advanced-bio',
    title: 'JEE / IAT Biology Advanced Concept Paper',
    category: 'JEE Biology',
    subject: 'Biology',
    totalQuestions: 45,
    durationMinutes: 45,
    totalMarks: 180,
    difficulty: 'Hard',
    attemptsCount: 3120,
    rating: 4.89,
    isNew: true,
    description: 'Advanced multi-concept analytical problem solving tailored for IISER IAT, NISER NEST, and integrated bio-science entrance exams.',
    syllabus: [
      'Biophysics & Energetics in Cellular Respiration',
      'Quantitative Evolutionary Biology & Hardy-Weinberg Equilibrium',
      'Advanced Gene Regulation & Epigenetics',
      'Biotechnology Recombinant Vectors & Restriction Mapping'
    ],
    questions: [
      {
        id: 1,
        question: 'During oxidative phosphorylation in mitochondria, protons (H+) accumulate in which compartment to establish the electrochemical proton-motive force?',
        options: ['Mitochondrial Matrix', 'Intermembrane Space', 'Outer Membrane', 'Inner Cristae Core'],
        correctAnswer: 1,
        chapter: 'Respiration in Plants',
        ncertReference: 'Class 11 NCERT Biology, Chapter 12',
        explanation: 'Complexes I, III, and IV of the ETC pump protons from the matrix into the intermembrane space, creating the proton gradient that drives ATP Synthase (F0-F1).'
      },
      {
        id: 2,
        question: 'In a population at Hardy-Weinberg equilibrium, the frequency of a recessive allele (q) is 0.4. What is the expected frequency of heterozygous carriers (2pq)?',
        options: ['0.16', '0.36', '0.48', '0.24'],
        correctAnswer: 2,
        chapter: 'Evolution',
        ncertReference: 'Class 12 NCERT Biology, Chapter 6',
        explanation: 'If q = 0.4, then p = (1 - 0.4) = 0.6. The frequency of heterozygous carriers 2pq = 2 × 0.6 × 0.4 = 0.48 (48%).'
      }
    ]
  }
];

export const INSTITUTE_INFO = {
  name: 'Amerj Sir Institute',
  shortName: 'ASI',
  tagline: 'Premier Online CBT Test & Practice Platform for NEET & JEE Biology in Niwari',
  founder: 'Amerj Sir',
  experience: '12+ Years Mentoring NEET & JEE Toppers',
  stats: {
    studentsEnrolled: '15,400+',
    testsAttempted: '185,000+',
    avgScoreBoost: '94.6%',
    selectionRate: '88.4%'
  },
  contact: {
    phone: '+91 98765 43210',
    email: 'admissions@amerjsirinstitute.com',
    address: 'Amerj Sir Institute, Main Market, Niwari (M.P./U.P. Region)',
    whatsapp: '+91 98765 43210'
  }
};
