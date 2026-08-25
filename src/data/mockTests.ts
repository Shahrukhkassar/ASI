import { TestItem } from '../types';

export const MOCK_TESTS: TestItem[] = [
  {
    id: 'neet-bio-mock-1',
    title: 'Biology Full Syllabus Mock Test 1',
    category: 'NEET Full Syllabus',
    subject: 'Biology',
    totalQuestions: 90,
    durationMinutes: 60,
    totalMarks: 360,
    difficulty: 'Medium',
    attemptsCount: 4820,
    rating: 4.9,
    isPopular: true,
    description: 'Comprehensive NEET pattern test covering complete Class 11th & 12th Botany and Zoology syllabus strictly based on latest NTA NCERT guidelines.',
    syllabus: [
      'Diversity in Living World',
      'Structural Organisation in Animals and Plants',
      'Cell Structure and Function',
      'Plant & Human Physiology',
      'Reproduction & Genetics',
      'Biotechnology & Ecology'
    ],
    questions: [
      {
        id: 1,
        question: 'Which of the following hormones is released by the beta-cells of the islets of Langerhans in the pancreas and helps lower blood glucose levels?',
        options: ['Glucagon', 'Insulin', 'Somatostatin', 'Epinephrine'],
        correctAnswer: 1,
        chapter: 'Chemical Coordination and Integration',
        ncertReference: 'Class 11 NCERT Biology, Page 337',
        explanation: 'Beta-cells of Islets of Langerhans secrete insulin, a peptide hormone which plays a major role in the regulation of glucose homeostasis by stimulating glycogenesis.'
      },
      {
        id: 2,
        question: 'In DNA replication, the Okazaki fragments on the lagging strand are joined together by the enzyme:',
        options: ['DNA Polymerase I', 'DNA Helicase', 'DNA Ligase', 'RNA Primase'],
        correctAnswer: 2,
        chapter: 'Molecular Basis of Inheritance',
        ncertReference: 'Class 12 NCERT Biology, Page 106',
        explanation: 'DNA Ligase catalyzes the formation of phosphodiester bonds to join discontinuous Okazaki fragments synthesized on the lagging template strand.'
      },
      {
        id: 3,
        question: 'The site of light-dependent reactions of photosynthesis in chloroplasts is:',
        options: ['Stroma matrix', 'Thylakoid membrane and lumen', 'Outer membrane', 'Peroxisome'],
        correctAnswer: 1,
        chapter: 'Photosynthesis in Higher Plants',
        ncertReference: 'Class 11 NCERT Biology, Page 209',
        explanation: 'Light reaction or photochemical phase occurs in the thylakoid membranes where chlorophyll pigments, Photosystem I and II, and ATP synthase are located.'
      },
      {
        id: 4,
        question: 'A Mendelian monohybrid cross between heterozygous tall pea plants (Tt x Tt) yields what phenotypic ratio in the F2 generation?',
        options: ['1 : 2 : 1', '3 : 1', '9 : 3 : 3 : 1', '2 : 1'],
        correctAnswer: 1,
        chapter: 'Principles of Inheritance and Variation',
        ncertReference: 'Class 12 NCERT Biology, Page 72',
        explanation: 'The phenotypic ratio for monohybrid F2 is 3 Tall (TT, Tt, Tt) : 1 Dwarf (tt). The genotypic ratio is 1:2:1.'
      },
      {
        id: 5,
        question: 'Which enzyme is used in Polymerase Chain Reaction (PCR) for thermal stability during high denaturation temperatures?',
        options: ['RNA Polymerase II', 'Taq Polymerase', 'Reverse Transcriptase', 'DNA Topoisomerase'],
        correctAnswer: 1,
        chapter: 'Biotechnology: Principles and Processes',
        ncertReference: 'Class 12 NCERT Biology, Page 202',
        explanation: 'Taq polymerase is isolated from the bacterium Thermus aquaticus. It remains active during the high temperature denaturation step (94°C).'
      }
    ]
  },
  {
    id: 'neet-human-physio-master',
    title: 'Human Physiology Master Challenge',
    category: 'Class 11 Biology',
    subject: 'Biology',
    totalQuestions: 50,
    durationMinutes: 45,
    totalMarks: 200,
    difficulty: 'Hard',
    attemptsCount: 6840,
    rating: 4.95,
    isPopular: true,
    description: 'High-yield conceptual questions focused on Digestion, Breathing, Circulation, Excretion, Locomotion, and Neural Coordination.',
    syllabus: [
      'Breathing and Exchange of Gases',
      'Body Fluids and Circulation',
      'Excretory Products and Elimination',
      'Locomotion and Movement',
      'Neural Control & Chemical Coordination'
    ],
    questions: [
      {
        id: 1,
        question: 'Which valve prevents the backflow of blood from the left ventricle into the left atrium during ventricular systole?',
        options: ['Tricuspid valve', 'Bicuspid (Mitral) valve', 'Aortic semilunar valve', 'Eustachian valve'],
        correctAnswer: 1,
        chapter: 'Body Fluids and Circulation',
        ncertReference: 'Class 11 NCERT Biology, Page 283',
        explanation: 'The bicuspid or mitral valve guards the opening between the left atrium and the left ventricle, preventing backflow into the atrium.'
      },
      {
        id: 2,
        question: 'In the human nephron, maximum reabsorption of water and electrolytes (70-80%) takes place in:',
        options: ['Proximal Convoluted Tubule (PCT)', 'Loop of Henle descending limb', 'Distal Convoluted Tubule (DCT)', 'Collecting Duct'],
        correctAnswer: 0,
        chapter: 'Excretory Products and their Elimination',
        ncertReference: 'Class 11 NCERT Biology, Page 294',
        explanation: 'PCT is lined by simple cuboidal brush border epithelium which increases surface area for reabsorption of nearly all essential nutrients and 70-80% electrolytes.'
      },
      {
        id: 3,
        question: 'During skeletal muscle contraction, which of the following bands remains constant in length?',
        options: ['I-band', 'H-zone', 'A-band', 'Sarcomere length'],
        correctAnswer: 2,
        chapter: 'Locomotion and Movement',
        ncertReference: 'Class 11 NCERT Biology, Page 307',
        explanation: 'According to the Sliding Filament Theory, actin filaments slide over myosin. The A-band (length of thick myosin filaments) retains its length while I-band and H-zone shorten.'
      },
      {
        id: 4,
        question: 'The respiratory rhythm center responsible for maintaining basic breathing rhythm is located in the:',
        options: ['Pons region (Pneumotaxic center)', 'Medulla oblongata', 'Cerebellum', 'Hypothalamus'],
        correctAnswer: 1,
        chapter: 'Breathing and Exchange of Gases',
        ncertReference: 'Class 11 NCERT Biology, Page 275',
        explanation: 'A specialized center present in the medulla region of brain called respiratory rhythm center is primarily responsible for this regulation.'
      }
    ]
  },
  {
    id: 'neet-genetics-molecular',
    title: 'Genetics & Molecular Basis of Inheritance',
    category: 'Class 12 Biology',
    subject: 'Biology',
    totalQuestions: 60,
    durationMinutes: 50,
    totalMarks: 240,
    difficulty: 'Hard',
    attemptsCount: 5290,
    rating: 4.88,
    isPopular: true,
    description: 'Master Mendelian inheritance, chromosomal aberrations, DNA transcription, translation, and genetic code mechanics.',
    syllabus: [
      'Mendel’s Laws of Inheritance',
      'Sex Determination & Pedigree Analysis',
      'Structure of DNA & RNA',
      'Replication, Transcription & Translation',
      'Lac Operon & Human Genome Project'
    ],
    questions: [
      {
        id: 1,
        question: 'Which of the following codons functions as both the initiator codon and codes for Methionine in eukaryotes?',
        options: ['UAA', 'AUG', 'UAG', 'UGA'],
        correctAnswer: 1,
        chapter: 'Molecular Basis of Inheritance',
        ncertReference: 'Class 12 NCERT Biology, Page 112',
        explanation: 'AUG is the universal start codon that codes for Methionine (Met). UAA, UAG, and UGA are stop (nonsense) codons.'
      },
      {
        id: 2,
        question: 'In the Lac Operon model, the repressor protein is permanently synthesized by which gene?',
        options: ['z gene', 'y gene', 'i gene', 'a gene'],
        correctAnswer: 2,
        chapter: 'Molecular Basis of Inheritance',
        ncertReference: 'Class 12 NCERT Biology, Page 117',
        explanation: 'The i gene codes for the repressor of the lac operon. It is expressed constitutively (all the time).'
      },
      {
        id: 3,
        question: 'Turner’s syndrome in human females is characterized by which chromosomal karyotype?',
        options: ['47, XXY', '45 with X0', '47, +21', '47, XYY'],
        correctAnswer: 1,
        chapter: 'Principles of Inheritance and Variation',
        ncertReference: 'Class 12 NCERT Biology, Page 92',
        explanation: 'Turner\'s syndrome is caused due to the absence of one of the X chromosomes, i.e., 45 with X0. Affected females are sterile with rudimentary ovaries.'
      }
    ]
  },
  {
    id: 'neet-cell-biomolecules',
    title: 'Cell Biology & Biomolecules Rapid Fire',
    category: 'Class 11 Biology',
    subject: 'Biology',
    totalQuestions: 45,
    durationMinutes: 40,
    totalMarks: 180,
    difficulty: 'Easy',
    attemptsCount: 3950,
    rating: 4.85,
    isNew: true,
    description: 'Test your foundation in prokaryotic & eukaryotic cells, organelles, mitosis/meiosis, proteins, carbohydrates, and enzymes.',
    syllabus: [
      'Cell as Basic Unit of Life',
      'Endomembrane System',
      'Cell Cycle and Cell Division (Mitosis, Meiosis)',
      'Primary and Secondary Metabolites',
      'Enzyme Kinetics and Inhibition'
    ],
    questions: [
      {
        id: 1,
        question: 'Which cell organelle is known as the "protein factory" and lacks a surrounding membrane?',
        options: ['Lysosome', 'Ribosome', 'Golgi apparatus', 'Peroxisome'],
        correctAnswer: 1,
        chapter: 'Cell: The Unit of Life',
        ncertReference: 'Class 11 NCERT Biology, Page 136',
        explanation: 'Ribosomes are non-membrane bound granular structures made of RNA and proteins, serving as sites of protein synthesis in all cells.'
      },
      {
        id: 2,
        question: 'Crossing over between non-sister chromatids of homologous chromosomes occurs during which stage of prophase I?',
        options: ['Leptotene', 'Zygotene', 'Pachytene', 'Diplotene'],
        correctAnswer: 2,
        chapter: 'Cell Cycle and Cell Division',
        ncertReference: 'Class 11 NCERT Biology, Page 168',
        explanation: 'During Pachytene stage, crossing over is mediated by the enzyme recombinase between non-sister chromatids of bivalents.'
      },
      {
        id: 3,
        question: 'A competitive inhibitor of the enzyme succinate dehydrogenase is:',
        options: ['Malonate', 'Oxaloacetate', 'Fumarate', 'Alpha-ketoglutarate'],
        correctAnswer: 0,
        chapter: 'Biomolecules',
        ncertReference: 'Class 11 NCERT Biology, Page 158',
        explanation: 'Malonate closely resembles the substrate succinate in structure and competitively inhibits succinic dehydrogenase.'
      }
    ]
  },
  {
    id: 'neet-plant-physio',
    title: 'Plant Physiology & Photosynthesis Deep-Dive',
    category: 'Class 11 Biology',
    subject: 'Biology',
    totalQuestions: 50,
    durationMinutes: 45,
    totalMarks: 200,
    difficulty: 'Medium',
    attemptsCount: 3410,
    rating: 4.79,
    description: 'Master Light/Dark reactions, C3 & C4 pathways, Calvin cycle, Respiration in plants, and Plant Growth Regulators (Auxins, Cytokinins, ABA).',
    syllabus: [
      'Photosynthesis in Higher Plants',
      'C4 pathway & Kranz Anatomy',
      'Respiration in Plants (Glycolysis & Krebs)',
      'Plant Growth and Development',
      'Phytohormones & Photoperiodism'
    ],
    questions: [
      {
        id: 1,
        question: 'The primary CO2 acceptor in C4 plants during the Hatch and Slack pathway is:',
        options: ['RuBP (Ribulose 1,5-bisphosphate)', 'PEP (Phosphoenolpyruvate)', 'PGA (3-Phosphoglyceric acid)', 'OAA (Oxaloacetic acid)'],
        correctAnswer: 1,
        chapter: 'Photosynthesis in Higher Plants',
        ncertReference: 'Class 11 NCERT Biology, Page 218',
        explanation: 'In C4 plants, PEP is the primary CO2 acceptor located in mesophyll cells, catalyzed by PEP carboxylase.'
      },
      {
        id: 2,
        question: 'Which plant hormone is widely known for inducing seed dormancy and closure of stomata during water stress?',
        options: ['Gibberellic Acid', 'Abscisic Acid (ABA)', 'Cytokinin', 'Ethylene'],
        correctAnswer: 1,
        chapter: 'Plant Growth and Development',
        ncertReference: 'Class 11 NCERT Biology, Page 250',
        explanation: 'Abscisic Acid (ABA) is also known as the stress hormone because it increases tolerance of plants to various stresses and causes stomatal closure.'
      }
    ]
  },
  {
    id: 'neet-ecology-mega',
    title: 'Ecology & Environment High Yield Mock',
    category: 'High Yield',
    subject: 'Biology',
    totalQuestions: 50,
    durationMinutes: 45,
    totalMarks: 200,
    difficulty: 'Easy',
    attemptsCount: 2780,
    rating: 4.92,
    description: 'High-scoring 16% weightage unit in NEET. Covers Population Interactions, Ecological Pyramids, Biodiversity Hotspots & Conservation.',
    syllabus: [
      'Organisms and Populations',
      'Ecosystem & Energy Flow',
      'Biodiversity and its Conservation',
      'Environmental Issues & Protocols'
    ],
    questions: [
      {
        id: 1,
        question: 'An interaction between two species where one species is benefited and the other is neither harmed nor benefited is called:',
        options: ['Mutualism', 'Amensalism', 'Commensalism', 'Parasitism'],
        correctAnswer: 2,
        chapter: 'Organisms and Populations',
        ncertReference: 'Class 12 NCERT Biology, Page 237',
        explanation: 'Commensalism (+, 0) is an interaction where one species benefits while the other remains unaffected (e.g. orchid growing as an epiphyte on a mango branch).'
      },
      {
        id: 2,
        question: 'Which pyramid of ecology is ALWAYS upright and can never be inverted?',
        options: ['Pyramid of Biomass in sea', 'Pyramid of Numbers in tree', 'Pyramid of Energy', 'Pyramid of Biomass in grassland'],
        correctAnswer: 2,
        chapter: 'Ecosystem',
        ncertReference: 'Class 12 NCERT Biology, Page 249',
        explanation: 'Pyramid of energy is always upright because when energy flows from a particular trophic level to the next, some energy is always lost as heat at each step (10% law).'
      }
    ]
  },
  {
    id: 'jee-bio-advanced',
    title: 'JEE / IAT Biology Diagnostic Paper',
    category: 'JEE Biology',
    subject: 'Biology',
    totalQuestions: 60,
    durationMinutes: 60,
    totalMarks: 240,
    difficulty: 'Hard',
    attemptsCount: 3120,
    rating: 4.87,
    isNew: true,
    description: 'Advanced multi-concept problem solving tailored for IISER IAT, NISER NEST, and integrated bio-science entrance exams.',
    syllabus: [
      'Biophysics and Thermodynamics in Cells',
      'Advanced Gene Regulation',
      'Quantitative Evolutionary Biology',
      'Computational Molecular Biology'
    ],
    questions: [
      {
        id: 1,
        question: 'During oxidative phosphorylation in mitochondria, protons (H+) accumulate in which compartment to generate the proton-motive force?',
        options: ['Mitochondrial Matrix', 'Intermembrane Space', 'Outer Membrane', 'Inner Cristae Core'],
        correctAnswer: 1,
        chapter: 'Respiration in Plants',
        ncertReference: 'Class 11 NCERT Biology, Page 233',
        explanation: 'Protons are pumped from the mitochondrial matrix into the intermembrane space across the inner mitochondrial membrane by complexes I, III, and IV.'
      }
    ]
  },
  {
    id: 'neet-grand-all-india',
    title: 'All-India Grand Mock Test Series 2',
    category: 'NEET Full Syllabus',
    subject: 'Biology',
    totalQuestions: 100,
    durationMinutes: 90,
    totalMarks: 400,
    difficulty: 'Hard',
    attemptsCount: 8930,
    rating: 4.97,
    isPopular: true,
    description: 'Exact NTA NEET 2026 simulation with Section A (35 questions) & Section B (15 questions) pattern for Botany and Zoology.',
    syllabus: [
      'Complete Class 11th Botany & Zoology',
      'Complete Class 12th Botany & Zoology',
      'Assertion-Reasoning & Statement Type Questions',
      'Diagram-based NCERT identification'
    ],
    questions: [
      {
        id: 1,
        question: 'Select the correct statement regarding Restriction Endonucleases (molecular scissors):',
        options: [
          'They cut single-stranded DNA randomly.',
          'They recognize specific palindromic nucleotide sequences in DNA.',
          'They join RNA primers to DNA fragments.',
          'They are isolated solely from viral capsids.'
        ],
        correctAnswer: 1,
        chapter: 'Biotechnology: Principles and Processes',
        ncertReference: 'Class 12 NCERT Biology, Page 196',
        explanation: 'Restriction enzymes recognize specific palindromic DNA sequences and cleave both strands at precise positions relative to the recognition site.'
      },
      {
        id: 2,
        question: 'Which of the following is NOT an endocrine gland?',
        options: ['Thyroid', 'Adrenal', 'Salivary Gland', 'Pituitary'],
        correctAnswer: 2,
        chapter: 'Chemical Coordination and Integration',
        ncertReference: 'Class 11 NCERT Biology, Page 331',
        explanation: 'Salivary glands are exocrine glands that pour their secretions via ducts. Endocrine glands are ductless glands.'
      }
    ]
  }
];

export const INSTITUTE_INFO = {
  name: 'Amerj Sir Institute',
  shortName: 'ASI',
  tagline: 'Premier Online Test & Practice Platform for NEET & JEE Biology',
  founder: 'Amerj Sir',
  experience: '12+ Years Mentoring Toppers',
  stats: {
    studentsEnrolled: '15,400+',
    testsAttempted: '185,000+',
    avgScoreBoost: '94.6%',
    selectionRate: '88.4%'
  },
  contact: {
    phone: '+91 98765 43210',
    email: 'admissions@amerjsirinstitute.com',
    address: 'ASI Knowledge Tower, Sector 14, Education Hub, Kota & New Delhi',
    whatsapp: '+91 98765 43210'
  }
};
