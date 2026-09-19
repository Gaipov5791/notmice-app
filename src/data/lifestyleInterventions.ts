import { BiomarkerDefinition } from '../types';

export interface LifestyleRecommendation {
  id: string;
  biomarkerId: string;
  title: string;
  category: 'nutrition' | 'exercise' | 'supplementation' | 'sleep_circadian' | 'habits';
  priority: 'high' | 'moderate' | 'maintenance';
  estimatedPhenoReductionYears: number; // e.g. -0.8 years
  clinicalMechanism: string;
  actionProtocol: string[];
  evidenceLevel: 'Grade A (Meta-Analysis / RCTs)' | 'Grade B (Clinical Cohort / NHANES)' | 'Grade C (Epidemiological / Mechanistic)';
  targetGoal: string;
  studyReference: string;
  contraindicationsOrNotes?: string;
}

export const LIFESTYLE_KNOWLEDGE_BASE: Record<string, {
  highRiskRecommendations: LifestyleRecommendation[];
  moderateRiskRecommendations: LifestyleRecommendation[];
  optimalRecommendations: LifestyleRecommendation[];
}> = {
  crp: {
    highRiskRecommendations: [
      {
        id: 'crp-anti-inflam-diet',
        biomarkerId: 'crp',
        title: 'Targeted Inflammatory Resolution Protocol (Omega-3 & Mediterranean Base)',
        category: 'nutrition',
        priority: 'high',
        estimatedPhenoReductionYears: -1.2,
        clinicalMechanism: 'Systemic hs-CRP is the heaviest logarithmic mortality weight in PhenoAge. EPA/DHA resolves vascular inflammation by inhibiting NF-κB transcription and driving specialized pro-resolving mediators (SPMs).',
        actionProtocol: [
          'Incorporate high-potency molecularly distilled Omega-3 triglycerides (2,000–3,000 mg combined EPA + DHA daily).',
          'Eliminate refined seed oils high in linoleic acid (corn, soybean, cottonseed) in favor of high-polyphenol extra virgin olive oil (>500 mg/kg polyphenols).',
          'Add 1-2 cups of dark berries (blueberries, blackberries) and daily cruciferous vegetables (sulforaphane from broccoli sprouts).'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Bring hs-CRP < 0.80 mg/L (current is elevated)',
        studyReference: 'Levine et al., Aging 2018; Calder PC, Biochim Biophys Acta 2015',
        contraindicationsOrNotes: 'Consult physician if on anti-platelet or anti-coagulation therapy before high-dose EPA.'
      },
      {
        id: 'crp-zone2-cardio',
        biomarkerId: 'crp',
        title: 'Mitochondrial Aerobic Base Conditioning (Zone 2)',
        category: 'exercise',
        priority: 'high',
        estimatedPhenoReductionYears: -0.9,
        clinicalMechanism: 'Skeletal muscle acts as an endocrine organ producing IL-6 acutely during low-intensity contractions, which paradoxically triggers systemic release of anti-inflammatory IL-10 and IL-1ra, suppressing chronic basal CRP.',
        actionProtocol: [
          'Perform 150–180 minutes weekly of continuous Zone 2 aerobic work (lactate 1.5–2.0 mmol/L, conversational pace, cycling/jogging/rowing).',
          'Distribute across 3–4 sessions of 40–50 minutes each.',
          'Avoid chronic overtraining which elevates resting baseline CRP.'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Reduce resting sterile inflammaging baseline',
        studyReference: 'Petersen AM & Pedersen BK, J Appl Physiol 2005; NHANES Mortality Analysis'
      },
      {
        id: 'crp-sleep-apnea-hygiene',
        biomarkerId: 'crp',
        title: 'Deep Slow-Wave Sleep Consolidation & Airway Screening',
        category: 'sleep_circadian',
        priority: 'moderate',
        estimatedPhenoReductionYears: -0.6,
        clinicalMechanism: 'Sleep fragmentation and intermittent hypoxia trigger sympathoexcitation and hepatic acute-phase reactant synthesis (CRP and fibrinogen). Deep slow-wave sleep downregulates nocturnal IL-6 cascades.',
        actionProtocol: [
          'Screen for nocturnal hypopnea/apnea if snoring or morning fatigue is present (HST or WatchPAT).',
          'Maintain rigid 7.5–8.5 hour nocturnal sleep opportunity with consistent circadian light exposure (10,000 lux within 30 min of wake).',
          'Keep bedroom ambient temperature cool (18°C / 65°F) and completely dark.'
        ],
        evidenceLevel: 'Grade B (Clinical Cohort / NHANES)',
        targetGoal: 'Sleep efficiency > 85%, deep sleep > 15%',
        studyReference: 'Irwin MR et al., Biol Psychiatry 2016'
      }
    ],
    moderateRiskRecommendations: [
      {
        id: 'crp-curcumin-resveratrol',
        biomarkerId: 'crp',
        title: 'NF-κB Inhibition via Bioavailable Curcuminoids',
        category: 'supplementation',
        priority: 'moderate',
        estimatedPhenoReductionYears: -0.4,
        clinicalMechanism: 'Phytochemical polyphenol complexes downregulate pro-inflammatory cytokines TNF-α, IL-1β, and COX-2 without gastrointestinal ulceration.',
        actionProtocol: [
          'Supplement with phytosome-bound curcumin (e.g. Meriva or BCM-95) 500 mg twice daily with food.',
          'Pair with quercetin (500 mg) or citrus bioflavonoids for endothelial barrier integrity.'
        ],
        evidenceLevel: 'Grade B (Clinical Cohort / NHANES)',
        targetGoal: 'Maintain hs-CRP strictly under 0.6 mg/L',
        studyReference: 'Ferguson et al., Clin Nutr 2021'
      }
    ],
    optimalRecommendations: [
      {
        id: 'crp-optimal-maintenance',
        biomarkerId: 'crp',
        title: 'Sustained Sterile Inflammation Shield',
        category: 'habits',
        priority: 'maintenance',
        estimatedPhenoReductionYears: -0.2,
        clinicalMechanism: 'Your hs-CRP is in the optimal longevity range (<0.8 mg/L), significantly protecting your vascular tree and biological age trajectory.',
        actionProtocol: [
          'Maintain annual dental periodontal cleanings (periodontal pathogens are a covert driver of CRP spikes).',
          'Continue balanced antioxidant rich dietary patterns and restorative recovery cycles.'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Preserve hs-CRP between 0.20 – 0.70 mg/L',
        studyReference: 'Levine et al., Aging 2018'
      }
    ]
  },

  glucose: {
    highRiskRecommendations: [
      {
        id: 'glu-glycemic-time-restricted',
        biomarkerId: 'glucose',
        title: 'Time-Restricted Feeding & Postprandial Glucose Blunting',
        category: 'nutrition',
        priority: 'high',
        estimatedPhenoReductionYears: -1.0,
        clinicalMechanism: 'Chronic glycaemic excursions crosslink collagen via advanced glycation end-products (AGEs), driving arterial stiffening and accelerating Gompertz mortality. Intermittent fasting enhances GLUT4 translocation and hepatic insulin sensitivity.',
        actionProtocol: [
          'Establish a 14:10 or 16:8 diurnal time-restricted feeding window, concluding dinner at least 3 hours before sleep.',
          'Sequence macronutrients: consume dietary fiber and leafy greens first, proteins/fats second, and complex carbohydrates last to attenuate postprandial glucose spike by 40%.',
          'Incorporate 1–2 tablespoons of apple cider vinegar (acetic acid) in water before starchy meals.'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Fasting glucose 75–86 mg/dL; HbA1c < 5.2%',
        studyReference: 'Sutton EF et al., Cell Metab 2018; Shukla AP et al., Diabetes Care 2015'
      },
      {
        id: 'glu-post-meal-movement',
        biomarkerId: 'glucose',
        title: 'Non-Insulin-Dependent Muscle Contraction (Post-Meal Movement)',
        category: 'exercise',
        priority: 'high',
        estimatedPhenoReductionYears: -0.7,
        clinicalMechanism: 'Skeletal muscle contraction triggers GLUT4 glucose transporter translocation directly via AMPK signaling, absorbing systemic glucose without requiring heavy pancreatic beta-cell insulin secretion.',
        actionProtocol: [
          'Execute a brisk 10–15 minute walk immediately following the largest carbohydrate-containing meals of the day.',
          'Incorporate soleus pushups or light bodyweight squats during prolonged seated desk work.'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Prevent postprandial blood sugar spikes exceeding 120 mg/dL',
        studyReference: 'Reynolds AN et al., Diabetologia 2016; Hamilton MT et al., iScience 2022'
      },
      {
        id: 'glu-berberine-inno',
        biomarkerId: 'glucose',
        title: 'AMPK Activation via Berberine Phytosome or Inositol',
        category: 'supplementation',
        priority: 'moderate',
        estimatedPhenoReductionYears: -0.5,
        clinicalMechanism: 'Berberine promotes mitochondrial AMPK phosphorylation and upregulates insulin receptor expression with efficacy comparable to first-line pharmacotherapies in clinical trials.',
        actionProtocol: [
          'Take 500 mg bio-enhanced berberine phytosome 15 minutes before high-carbohydrate meals.',
          'Consider pairing with alpha-lipoic acid (300 mg) for peripheral nerve antioxidant protection.'
        ],
        evidenceLevel: 'Grade B (Clinical Cohort / NHANES)',
        targetGoal: 'Normalize insulin sensitivity index (HOMA-IR < 1.0)',
        studyReference: 'Yin J et al., Metabolism 2008'
      }
    ],
    moderateRiskRecommendations: [
      {
        id: 'glu-resistance-hypertrophy',
        biomarkerId: 'glucose',
        title: 'Skeletal Muscle Reservoir Expansion (Hypertrophy)',
        category: 'exercise',
        priority: 'moderate',
        estimatedPhenoReductionYears: -0.5,
        clinicalMechanism: 'Skeletal muscle is responsible for over 80% of whole-body insulin-mediated glucose disposal. Expanding contractile muscle volume creates a massive metabolic sink for circulating carbohydrates.',
        actionProtocol: [
          'Perform full-body progressive resistance training 3x weekly focusing on compound movements (squat/hinge, push, pull).',
          'Target 10–14 hard sets per major muscle group weekly near mechanical failure (RPE 7-9).'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Increase lean muscle mass relative to visceral adiposity',
        studyReference: 'Srikanthan P & Karlamangla AS, J Clin Endocrinol Metab 2011'
      }
    ],
    optimalRecommendations: [
      {
        id: 'glu-optimal-preservation',
        biomarkerId: 'glucose',
        title: 'Metabolic Flexibility Preservation',
        category: 'habits',
        priority: 'maintenance',
        estimatedPhenoReductionYears: -0.2,
        clinicalMechanism: 'Fasting glucose is in the longevity sweet spot (72–88 mg/dL), minimizing glycation and diabetic microvascular damage.',
        actionProtocol: [
          'Maintain regular periodic continuous glucose monitoring (CGM) 2–4 weeks per year to detect subtle lifestyle drift.',
          'Preserve high dietary fiber intake (>35 g/day) from varied whole foods.'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Keep glycemic variability standard deviation < 15 mg/dL',
        studyReference: 'Levine et al., Aging 2018'
      }
    ]
  },

  albumin: {
    highRiskRecommendations: [
      {
        id: 'alb-protein-optimization',
        biomarkerId: 'albumin',
        title: 'Anabolic Dietary Amino Acid Replenishment Protocol',
        category: 'nutrition',
        priority: 'high',
        estimatedPhenoReductionYears: -1.1,
        clinicalMechanism: 'Serum albumin is synthesized solely by hepatocytes. In PhenoAge, higher albumin strongly decelerates aging (Levine coefficient -0.0336). Suboptimal albumin (<45 g/L) signals early sarcopenia, protein malabsorption, or occult hepatic stress.',
        actionProtocol: [
          'Consume 1.6–2.0 grams of high-biological-value protein per kilogram of ideal body weight per day.',
          'Distribute across 3–4 meals containing at least 2.5–3.0 g of leucine per feeding to trigger mTORC1 muscle protein synthesis.',
          'Incorporate hydrolyzed collagen peptides (15 g/day) with vitamin C to support extracellular matrix and hepatic protein reserves.'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Elevate serum albumin to 45.0 – 50.0 g/L',
        studyReference: 'Morton RW et al., Br J Sports Med 2018; Levine et al., Aging 2018'
      },
      {
        id: 'alb-gut-absorption',
        biomarkerId: 'albumin',
        title: 'Gut Mucosal Barrier Optimization & Digestive Enzyme Support',
        category: 'habits',
        priority: 'moderate',
        estimatedPhenoReductionYears: -0.5,
        clinicalMechanism: 'Hypochlorhydria (low stomach acid) and intestinal hyperpermeability impair dietary polypeptide cleavage into free amino acids, starving hepatic albumin production.',
        actionProtocol: [
          'Chew food thoroughly (20–30 chews per bite) and avoid drinking large volumes of ice water during protein meals.',
          'Consider supplemental betaine HCl and protease enzymes with dense protein meals if experiencing postprandial heaviness.',
          'Support enterocyte renewal with L-Glutamine (5 g daily on an empty stomach) and zinc carnosine.'
        ],
        evidenceLevel: 'Grade B (Clinical Cohort / NHANES)',
        targetGoal: 'Restore optimal amino acid absorption efficiency',
        studyReference: 'Camilleri M, Gut 2019'
      }
    ],
    moderateRiskRecommendations: [
      {
        id: 'alb-liver-support',
        biomarkerId: 'albumin',
        title: 'Hepatoprotective Milk Thistle (Silymarin) & NAC',
        category: 'supplementation',
        priority: 'moderate',
        estimatedPhenoReductionYears: -0.4,
        clinicalMechanism: 'Supports ribosomal RNA polymerase I transcription in hepatocytes, accelerating endogenous cellular protein synthesis.',
        actionProtocol: [
          'Standardized Milk Thistle extract (80% silymarin) 250 mg twice daily.',
          'N-Acetylcysteine (NAC) 600 mg daily to preserve intracellular glutathione stores.'
        ],
        evidenceLevel: 'Grade B (Clinical Cohort / NHANES)',
        targetGoal: 'Support hepatic synthetic function',
        studyReference: 'Federico A et al., Molecules 2017'
      }
    ],
    optimalRecommendations: [
      {
        id: 'alb-optimal-state',
        biomarkerId: 'albumin',
        title: 'Robust Hepatic Synthetic Capacity',
        category: 'nutrition',
        priority: 'maintenance',
        estimatedPhenoReductionYears: -0.3,
        clinicalMechanism: 'Serum albumin is in the optimal longevity tier (>45 g/L), reflecting excellent organ reserve, systemic oncotic pressure, and low frailty risk.',
        actionProtocol: [
          'Continue regular resistance stimulus to maintain muscular demands for circulating albumin-bound nutrients.',
          'Ensure adequate hydration to maintain accurate plasma oncotic measurement.'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Preserve albumin between 46.0 – 50.0 g/L',
        studyReference: 'Levine et al., Aging 2018'
      }
    ]
  },

  rdw: {
    highRiskRecommendations: [
      {
        id: 'rdw-erythrocyte-turnover',
        biomarkerId: 'rdw',
        title: 'Active Methylation & Erythrocyte Membrane Integrity Protocol',
        category: 'supplementation',
        priority: 'high',
        estimatedPhenoReductionYears: -1.3,
        clinicalMechanism: 'RDW reflects variation in red blood cell volume (anisocytosis). In NHANES, RDW is the single heaviest mathematical hazard multiplier in PhenoAge (coefficient +0.3306). High RDW indicates stem cell senescence, oxidative hemolysis, or functional B12/folate insufficiency.',
        actionProtocol: [
          'Check functional methylation: test serum methylmalonic acid (MMA) and homocysteine to detect tissue B12 deficiency even if serum B12 appears normal.',
          'Supplement with bio-identical methylated B-complex: Methylfolate (L-5-MTHF 400–800 mcg) + Methylcobalamin (1,000 mcg) + Pyridoxal-5-Phosphate (P5P 25 mg).',
          'Support red blood cell membrane deformability with Vitamin E mixed tocotrienols (200 mg) and Astaxanthin (4 mg).'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Compress RDW < 12.5% (optimal longevity range)',
        studyReference: 'Levine et al., Aging 2018; Perlstein TS et al., Arch Intern Med 2009'
      },
      {
        id: 'rdw-iron-balance',
        biomarkerId: 'rdw',
        title: 'Iron Homeostasis & Ferritin Recalibration',
        category: 'habits',
        priority: 'moderate',
        estimatedPhenoReductionYears: -0.6,
        clinicalMechanism: 'Both hidden iron deficiency (without overt anemia) and iron overload (hemochromatosis/hepcidin activation) cause erratic erythropoiesis and high RDW variance.',
        actionProtocol: [
          'Review full iron panel: serum iron, total iron binding capacity (TIBC), and ferritin.',
          'If ferritin is elevated (>200 ng/mL in men or post-menopausal women), consider therapeutic blood donation to clear pro-oxidant senescent red cells.',
          'If ferritin is <40 ng/mL, take gentle iron bisglycinate on alternate mornings with vitamin C.'
        ],
        evidenceLevel: 'Grade B (Clinical Cohort / NHANES)',
        targetGoal: 'Stabilize ferritin in the 50–120 ng/mL sweet spot',
        studyReference: 'Patel KV et al., Crit Rev Oncol Hematol 2010'
      }
    ],
    moderateRiskRecommendations: [
      {
        id: 'rdw-antioxidant-defense',
        biomarkerId: 'rdw',
        title: 'Endothelial & Erythrocyte Glycocalyx Protection',
        category: 'nutrition',
        priority: 'moderate',
        estimatedPhenoReductionYears: -0.4,
        clinicalMechanism: 'Circulating red blood cells lack nuclei and cannot repair damaged lipids, making them highly susceptible to lipid peroxidation in oxidative environments.',
        actionProtocol: [
          'Incorporate deeply pigmented polyphenol foods (pomegranate, dark tart cherry, green tea EGCG).',
          'Eliminate oxidized culinary oils and charred meats that increase reactive oxygen species (ROS).'
        ],
        evidenceLevel: 'Grade B (Clinical Cohort / NHANES)',
        targetGoal: 'Minimize circulating lipid hydroperoxides',
        studyReference: 'Salvagno GL et al., Ann Transl Med 2015'
      }
    ],
    optimalRecommendations: [
      {
        id: 'rdw-optimal-status',
        biomarkerId: 'rdw',
        title: 'Harmonious Erythropoietic Kinetics',
        category: 'habits',
        priority: 'maintenance',
        estimatedPhenoReductionYears: -0.3,
        clinicalMechanism: 'Your RDW is in the elite longevity cohort (<12.5%), reflecting young bone marrow hematopoietic kinetics, low systemic frailty, and optimal cellular turnover.',
        actionProtocol: [
          'Maintain balanced micronutrient intake and avoid unnecessary extreme nutritional eliminations.',
          'Continue regular cardiovascular stress to promote healthy spleen erythrophagocytosis of older cells.'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Preserve RDW strictly between 11.5 – 12.5%',
        studyReference: 'Levine et al., Aging 2018'
      }
    ]
  },

  creatinine: {
    highRiskRecommendations: [
      {
        id: 'cr-hydration-renal-hemodynamics',
        biomarkerId: 'creatinine',
        title: 'Renal Glomerular Microcirculation & Electrolyte Hydration',
        category: 'habits',
        priority: 'high',
        estimatedPhenoReductionYears: -0.8,
        clinicalMechanism: 'Elevated serum creatinine signals reduced estimated glomerular filtration rate (eGFR) or microvascular renal capillary damage. Maintaining optimal renal perfusion preserves nephron density.',
        actionProtocol: [
          'Establish structured daily cellular hydration: consume 35–40 mL of water per kg of body weight, supplemented with balanced electrolytes (sodium, potassium, magnesium).',
          'Avoid acute NSAID overuse (ibuprofen, naproxen) which impairs afferent arteriolar prostacyclin synthesis and drops GFR.',
          'Monitor systolic blood pressure: maintain resting blood pressure strictly between 110–120 / 70–80 mmHg to avoid glomerulosclerosis.'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Restore serum creatinine to 0.70 – 1.05 mg/dL; eGFR > 90 mL/min',
        studyReference: 'Levine et al., Aging 2018; Clark WF et al., J Am Soc Nephrol 2011'
      },
      {
        id: 'cr-nitric-oxide-endothelial',
        biomarkerId: 'creatinine',
        title: 'Dietary Nitrate Endothelial Vasodilation',
        category: 'nutrition',
        priority: 'moderate',
        estimatedPhenoReductionYears: -0.4,
        clinicalMechanism: 'Inorganic dietary nitrates convert to nitric oxide (NO) via the enterosalivary pathway, promoting renal vascular dilation and reducing intraglomerular pressure.',
        actionProtocol: [
          'Incorporate dietary nitrates daily: 250 mL cold-pressed beetroot juice or 150 g raw arugula/spinach.',
          'Avoid antibacterial mouthwashes which eradicate the oral symbiotic bacteria necessary for nitrate-to-nitrite reduction.'
        ],
        evidenceLevel: 'Grade B (Clinical Cohort / NHANES)',
        targetGoal: 'Enhance renal parenchymal blood flow',
        studyReference: 'Kapil V et al., Hypertension 2010'
      }
    ],
    moderateRiskRecommendations: [
      {
        id: 'cr-creatine-clarification',
        biomarkerId: 'creatinine',
        title: 'Cystatin-C Cross-Validation Check',
        category: 'habits',
        priority: 'moderate',
        estimatedPhenoReductionYears: -0.3,
        clinicalMechanism: 'If you have substantial muscle mass or consume creatine monohydrate supplements, serum creatinine can read artificially elevated without true renal dysfunction.',
        actionProtocol: [
          'Order a Cystatin-C blood test at your next lab draw (Cystatin-C is muscle-mass-independent).',
          'Pause supplemental creatine monohydrate for 5 days prior to routine venous blood draws.'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Isolate true renal clearance from muscular mass artifact',
        studyReference: 'Inker LA et al., N Engl J Med 2012'
      }
    ],
    optimalRecommendations: [
      {
        id: 'cr-optimal-preservation',
        biomarkerId: 'creatinine',
        title: 'Healthy Glomerular Filtration Reserve',
        category: 'habits',
        priority: 'maintenance',
        estimatedPhenoReductionYears: -0.2,
        clinicalMechanism: 'Serum creatinine is within the optimal homeostatic band, indicating healthy nephron filtration and fluid balance.',
        actionProtocol: [
          'Maintain consistent hydration during intense thermogenic or endurance exercise.',
          'Continue balanced potassium intake from natural plant foods (avocados, leafy greens).'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Maintain creatinine between 0.75 – 1.05 mg/dL',
        studyReference: 'Levine et al., Aging 2018'
      }
    ]
  },

  lymphocyte: {
    highRiskRecommendations: [
      {
        id: 'lym-thymic-immunosenescence',
        biomarkerId: 'lymphocyte',
        title: 'Thymic Rejuvenation & Adaptive Immunity Preservation',
        category: 'habits',
        priority: 'high',
        estimatedPhenoReductionYears: -0.7,
        clinicalMechanism: 'A low lymphocyte percentage reflects myeloid skewing—a classic hallmark of immunosenescence where bone marrow produces excess inflammatory neutrophils at the expense of pathogen-clearing T and B cells.',
        actionProtocol: [
          'Optimize Vitamin D3 status: maintain serum 25(OH)D between 50–70 ng/mL (supplement 3,000–5,000 IU D3 paired with 100 mcg Vitamin K2-MK7).',
          'Ensure bioavailable zinc and copper balance (Zinc picolinate 20–25 mg paired with 1 mg copper) to support thymulin hormone activation.',
          'Engage in regular heat shock sauna therapy (15–20 minutes at 80°C / 176°F 3x weekly) which mobilizes circulating lymphocytes into peripheral surveillance.'
        ],
        evidenceLevel: 'Grade B (Clinical Cohort / NHANES)',
        targetGoal: 'Target lymphocyte percentage between 28% – 38%',
        studyReference: 'Levine et al., Aging 2018; Fahy GM et al., Aging Cell 2019 (TRIIM trial)'
      }
    ],
    moderateRiskRecommendations: [
      {
        id: 'lym-stress-cortisol',
        biomarkerId: 'lymphocyte',
        title: 'HPA-Axis Downregulation (Combat Glucocorticoid Lymphopenia)',
        category: 'habits',
        priority: 'moderate',
        estimatedPhenoReductionYears: -0.4,
        clinicalMechanism: 'Chronic hypercortisolemia induces apoptosis in naive lymphoid progenitors and suppresses lymphocyte recirculation.',
        actionProtocol: [
          'Practice 10 minutes of daily physiological sighing or box breathing (4-4-4-4) to elevate vagal tone.',
          'Incorporate adaptogenic Ashwagandha (KSM-66 300 mg) or Holy Basil tea in the late afternoon.'
        ],
        evidenceLevel: 'Grade B (Clinical Cohort / NHANES)',
        targetGoal: 'Attenuate stress-induced lymphocyte depletion',
        studyReference: 'Dhabhar FS, Immunol Res 2014'
      }
    ],
    optimalRecommendations: [
      {
        id: 'lym-optimal-state',
        biomarkerId: 'lymphocyte',
        title: 'Balanced Adaptive Lymphoid Lineage',
        category: 'habits',
        priority: 'maintenance',
        estimatedPhenoReductionYears: -0.2,
        clinicalMechanism: 'Your lymphocyte ratio is well-preserved (28–38%), demonstrating resilient immune competence without immune senescence skewing.',
        actionProtocol: [
          'Continue seasonal cold adaptation and varied physical stimuli to challenge immune flexibility.',
          'Maintain restorative 7.5+ hour sleep cycles.'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Maintain lymphocyte ratio between 28% – 38%',
        studyReference: 'Levine et al., Aging 2018'
      }
    ]
  },

  wbc: {
    highRiskRecommendations: [
      {
        id: 'wbc-chronic-infection-quench',
        biomarkerId: 'wbc',
        title: 'Occult Infection Screening & Inflammatory Quenching',
        category: 'habits',
        priority: 'high',
        estimatedPhenoReductionYears: -0.8,
        clinicalMechanism: 'A chronically elevated resting WBC count (>6.8 10³/µL), even within clinical lab "normal" ranges, indicates low-grade non-resolving immune activation, atherogenesis, and accelerated biological aging.',
        actionProtocol: [
          'Screen for occult low-grade foci: evaluate dental root canals, periodontal pockets, and chronic sinus inflammation with your clinical team.',
          'Incorporate botanical immune modulators: standardized elderberry, andrographis, or high-allicin aged garlic extract (Kyolic 600 mg).',
          'Eliminate chronic ultra-processed food consumption which promotes gut endotoxemia and leukocyte priming.'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Lower resting baseline WBC into the 4.5 – 6.2 10³/µL longevity window',
        studyReference: 'Levine et al., Aging 2018; Margolis KL et al., Arch Intern Med 2005'
      }
    ],
    moderateRiskRecommendations: [
      {
        id: 'wbc-endurance-recovery',
        biomarkerId: 'wbc',
        title: 'Autonomic Balance & Overtraining Recovery',
        category: 'exercise',
        priority: 'moderate',
        estimatedPhenoReductionYears: -0.4,
        clinicalMechanism: 'Excessive high-intensity anaerobic training without adequate parasympathetic recovery causes chronic leukocyte elevation via continuous muscle microtrauma.',
        actionProtocol: [
          'Monitor resting heart rate (RHR) and Heart Rate Variability (HRV) upon waking.',
          'Schedule at least 1–2 full active recovery or complete rest days per training microcycle.'
        ],
        evidenceLevel: 'Grade B (Clinical Cohort / NHANES)',
        targetGoal: 'Avoid sympathetic overtraining states',
        studyReference: 'Gleeson M, J Appl Physiol 2007'
      }
    ],
    optimalRecommendations: [
      {
        id: 'wbc-optimal-range',
        biomarkerId: 'wbc',
        title: 'Calm Baseline Innate Immunity',
        category: 'habits',
        priority: 'maintenance',
        estimatedPhenoReductionYears: -0.2,
        clinicalMechanism: 'Resting leukocyte count is calm and optimal (4.5–6.2 10³/µL), reflecting absence of chronic infection or arterial irritation.',
        actionProtocol: [
          'Maintain regular hand hygiene and seasonal respiratory prophylaxis.',
          'Avoid smoking or environmental vapor exposure which drives alveolar macrophage mobilization.'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Maintain WBC count in the 4.5 – 6.0 10³/µL zone',
        studyReference: 'Levine et al., Aging 2018'
      }
    ]
  },

  alp: {
    highRiskRecommendations: [
      {
        id: 'alp-hepatic-bone-protocol',
        biomarkerId: 'alp',
        title: 'Hepatobiliary Flow & Vitamin K2-D3 Bone Remodeling Protocol',
        category: 'supplementation',
        priority: 'high',
        estimatedPhenoReductionYears: -0.6,
        clinicalMechanism: 'Alkaline Phosphatase (ALP) is synthesized predominantly in the liver biliary tree and bone tissue. Elevated ALP correlates with vascular calcification, sluggish bile flow, or high uncoupled bone resorption.',
        actionProtocol: [
          'Support bile acid fluidity: incorporate bitter greens (dandelion greens, arugula, endive) and taurine (1,000 mg) to promote healthy biliary excretion.',
          'Direct calcium into bone matrix rather than vascular smooth muscle: supplement Vitamin K2 (MK-7 100–200 mcg) paired with Vitamin D3 (4,000 IU).',
          'Eliminate heavy alcohol intake which irritates hepatobiliary canaliculi.'
        ],
        evidenceLevel: 'Grade B (Clinical Cohort / NHANES)',
        targetGoal: 'Bring serum ALP into optimal range (45 – 70 U/L)',
        studyReference: 'Levine et al., Aging 2018; Maresz K, Integr Med (Encinitas) 2015'
      }
    ],
    moderateRiskRecommendations: [
      {
        id: 'alp-magnesium-bone',
        biomarkerId: 'alp',
        title: 'Magnesium Glycinate/Malate Bone Mineral Support',
        category: 'supplementation',
        priority: 'moderate',
        estimatedPhenoReductionYears: -0.3,
        clinicalMechanism: 'Magnesium is an essential cofactor for alkaline phosphatase homeostasis and regulates proper osteoblast/osteoclast coupling.',
        actionProtocol: [
          'Take 300–400 mg elemental magnesium (glycinate or malate) daily with evening meals.'
        ],
        evidenceLevel: 'Grade B (Clinical Cohort / NHANES)',
        targetGoal: 'Support bone mineral density and enzyme cofactor balance',
        studyReference: 'Castiglioni S et al., Nutrients 2013'
      }
    ],
    optimalRecommendations: [
      {
        id: 'alp-optimal-status',
        biomarkerId: 'alp',
        title: 'Optimized Hepatobiliary & Bone Mineral Status',
        category: 'habits',
        priority: 'maintenance',
        estimatedPhenoReductionYears: -0.2,
        clinicalMechanism: 'Your ALP is within the longevity reference window (45–75 U/L), indicating healthy biliary clearance and balanced skeletal turnover.',
        actionProtocol: [
          'Continue weight-bearing exercise to preserve skeletal mineral density.',
          'Maintain balanced cruciferous vegetable intake to assist hepatic phase II conjugation.'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Preserve ALP between 45 – 72 U/L',
        studyReference: 'Levine et al., Aging 2018'
      }
    ]
  },

  mcv: {
    highRiskRecommendations: [
      {
        id: 'mcv-b-vitamin-methylation',
        biomarkerId: 'mcv',
        title: 'One-Carbon Methylation & Macrocytosis Resolution Protocol',
        category: 'supplementation',
        priority: 'high',
        estimatedPhenoReductionYears: -0.7,
        clinicalMechanism: 'Elevated MCV (erythrocyte mean corpuscular volume > 92 fL) indicates impaired DNA synthesis during erythropoiesis, commonly driven by intracellular deficiency in folate, B12, or excessive alcohol intake.',
        actionProtocol: [
          'Evaluate serum folate and active B12 (holotranscobalamin).',
          'Supplement with active coenzymated vitamins: L-Methylfolate (800 mcg) + Methylcobalamin / Adenosylcobalamin (1,000 mcg).',
          'Moderate or eliminate alcohol consumption for 6–8 weeks to observe erythrocyte maturation normalization.'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Bring MCV into the optimal 86.0 – 91.0 fL window',
        studyReference: 'Levine et al., Aging 2018; Aslinia F et al., Clin Med Res 2006'
      }
    ],
    moderateRiskRecommendations: [
      {
        id: 'mcv-thyroid-screen',
        biomarkerId: 'mcv',
        title: 'Thyroid Function Evaluation (TSH & Free T3/T4)',
        category: 'habits',
        priority: 'moderate',
        estimatedPhenoReductionYears: -0.3,
        clinicalMechanism: 'Subclinical hypothyroidism frequently co-presents with mild red blood cell macrocytosis due to altered cellular membrane lipid turnover.',
        actionProtocol: [
          'Check thyroid panel (TSH, Free T3, Free T4, TPO antibodies) on next routine blood draw.',
          'Ensure adequate dietary iodine (kelp/seaweeds or iodized sea salt) and selenium (2 Brazil nuts daily).'
        ],
        evidenceLevel: 'Grade B (Clinical Cohort / NHANES)',
        targetGoal: 'Verify euthyroid metabolic state',
        studyReference: 'Antonijević N et al., Med Pregl 2006'
      }
    ],
    optimalRecommendations: [
      {
        id: 'mcv-optimal-status',
        biomarkerId: 'mcv',
        title: 'Precise Erythrocyte Volume & DNA Synthesis',
        category: 'habits',
        priority: 'maintenance',
        estimatedPhenoReductionYears: -0.2,
        clinicalMechanism: 'Your MCV is in the optimal 86–92 fL longevity tier, reflecting uninhibited cellular DNA replication and balanced one-carbon metabolism.',
        actionProtocol: [
          'Maintain folate-rich leafy greens (spinach, romaine, asparagus) in regular diet.',
          'Avoid chronic binge drinking to protect erythropoietic progenitor integrity.'
        ],
        evidenceLevel: 'Grade A (Meta-Analysis / RCTs)',
        targetGoal: 'Keep MCV stable between 86.0 – 91.5 fL',
        studyReference: 'Levine et al., Aging 2018'
      }
    ]
  }
};
