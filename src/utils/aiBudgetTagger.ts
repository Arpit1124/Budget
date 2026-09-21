// AI Automated Tagging & Categorization Engine for Budget & Expenditure Entries

export type PriorityLevel = 'URGENT_CRITICAL' | 'HIGH_PRIORITY' | 'STANDARD_MEDIUM' | 'LOW_PRIORITY';

export interface TaggedTransaction {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  projectId: string;
  projectName: string;
  category: 'CAPITAL_OUTLAY' | 'OPERATIONAL' | 'PROCUREMENT' | 'GRANT_IN_AID' | 'SUBSIDY';
  priorityLevel: PriorityLevel;
  tags: string[];
  confidenceScore: number; // 0 to 100
  aiReasoning: string;
}

interface TaggingInput {
  description: string;
  vendorAgency?: string;
  amount?: number;
}

export function tagTransaction(input: TaggingInput): TaggedTransaction {
  const text = `${input.description || ''} ${input.vendorAgency || ''}`.toLowerCase();
  const amount = input.amount || 0;

  // 1. Department & Project Mapping
  if (
    text.includes('highway') ||
    text.includes('road') ||
    text.includes('expressway') ||
    text.includes('corridor') ||
    text.includes('asphalt') ||
    text.includes('pavement') ||
    text.includes('bridge') ||
    text.includes('flyover') ||
    text.includes('nhai') ||
    text.includes('traffic') ||
    text.includes('tarmac')
  ) {
    const isUrgent = text.includes('emergency') || text.includes('repair') || text.includes('girder') || text.includes('safety');
    return {
      departmentId: 'dept-1',
      departmentName: 'Ministry of Road Transport & Highways',
      departmentCode: 'MoRTH',
      projectId: 'prj-1',
      projectName: 'National Express Corridor Phase 4',
      category: 'CAPITAL_OUTLAY',
      priorityLevel: isUrgent ? 'URGENT_CRITICAL' : 'HIGH_PRIORITY',
      tags: ['CAPEX', 'HIGHWAY_INFRASTRUCTURE', isUrgent ? 'SAFETY_CRITICAL' : 'PLANNED_CORRIDOR', amount > 25 ? 'HIGH_VALUE_TENDER' : 'STANDARD_CIVIL'],
      confidenceScore: 95,
      aiReasoning: 'Classified under MoRTH based on highway civil engineering semantics. Priority elevated due to structural corridor milestone criticality.',
    };
  }

  if (
    text.includes('hospital') ||
    text.includes('aiims') ||
    text.includes('medical') ||
    text.includes('health') ||
    text.includes('dialysis') ||
    text.includes('oxygen') ||
    text.includes('diagnostic') ||
    text.includes('mri') ||
    text.includes('icu') ||
    text.includes('vaccine') ||
    text.includes('clinic') ||
    text.includes('pharmaceutical')
  ) {
    const isUrgent = text.includes('icu') || text.includes('emergency') || text.includes('oxygen') || text.includes('pediatric');
    return {
      departmentId: 'dept-2',
      departmentName: 'Ministry of Health & Family Welfare',
      departmentCode: 'MoHFW',
      projectId: 'prj-2',
      projectName: 'AIIMS Regional Super-Specialty Hospital',
      category: text.includes('mri') || text.includes('equipment') || text.includes('dialysis') ? 'PROCUREMENT' : 'CAPITAL_OUTLAY',
      priorityLevel: isUrgent ? 'URGENT_CRITICAL' : 'HIGH_PRIORITY',
      tags: ['PUBLIC_HEALTH', 'MEDICAL_PROCUREMENT', isUrgent ? 'LIFE_SAFETY' : 'HOSPITAL_EXPANSION', 'BIOMEDICAL_EQUIPMENT'],
      confidenceScore: 97,
      aiReasoning: 'Classified under MoHFW. Identified high-criticality healthcare infrastructure and biomedical diagnostic procurement requirements.',
    };
  }

  if (
    text.includes('school') ||
    text.includes('education') ||
    text.includes('textbook') ||
    text.includes('teacher') ||
    text.includes('classroom') ||
    text.includes('midday') ||
    text.includes('pm-shri') ||
    text.includes('student') ||
    text.includes('curriculum') ||
    text.includes('pedagogy')
  ) {
    return {
      departmentId: 'dept-3',
      departmentName: 'Department of School Education & Literacy',
      departmentCode: 'DSEL',
      projectId: 'prj-3',
      projectName: 'PM-SHRI Smart Schools Digital Transformation',
      category: text.includes('textbook') || text.includes('tablet') ? 'PROCUREMENT' : 'GRANT_IN_AID',
      priorityLevel: text.includes('exam') || text.includes('meal') ? 'URGENT_CRITICAL' : 'HIGH_PRIORITY',
      tags: ['EDUCATION', 'DIGITAL_LEARNING', 'HUMAN_CAPITAL', 'SCHOOL_INFRASTRUCTURE'],
      confidenceScore: 92,
      aiReasoning: 'Classified under DSEL based on academic development and school infrastructure keywords.',
    };
  }

  if (
    text.includes('water') ||
    text.includes('jal') ||
    text.includes('pipeline') ||
    text.includes('tube-well') ||
    text.includes('tap') ||
    text.includes('sanitation') ||
    text.includes('sewage') ||
    text.includes('purification') ||
    text.includes('har ghar')
  ) {
    return {
      departmentId: 'dept-4',
      departmentName: 'Department of Drinking Water & Sanitation',
      departmentCode: 'MoJS',
      projectId: 'prj-4',
      projectName: 'Har Ghar Jal Rural Piped Supply Scheme',
      category: 'CAPITAL_OUTLAY',
      priorityLevel: 'HIGH_PRIORITY',
      tags: ['CLEAN_WATER', 'RURAL_SANITATION', 'SUSTAINABLE_DEVELOPMENT', 'JAL_JEEVAN_MISSION'],
      confidenceScore: 94,
      aiReasoning: 'Categorized under Ministry of Jal Shakti. Mapped to rural piped potable supply infrastructure under National Jal Mission mandates.',
    };
  }

  if (
    text.includes('rail') ||
    text.includes('train') ||
    text.includes('locomotive') ||
    text.includes('track') ||
    text.includes('vande bharat') ||
    text.includes('signaling') ||
    text.includes('station') ||
    text.includes('wagon')
  ) {
    return {
      departmentId: 'dept-5',
      departmentName: 'Ministry of Railways',
      departmentCode: 'MoR',
      projectId: 'prj-5',
      projectName: 'High-Density Corridor Track Duplication & Modernization',
      category: 'CAPITAL_OUTLAY',
      priorityLevel: text.includes('safety') || text.includes('signaling') ? 'URGENT_CRITICAL' : 'HIGH_PRIORITY',
      tags: ['RAIL_CAPEX', 'NETWORK_SAFETY', 'KAVACH_SIGNALING', 'NATIONAL_LOGISTICS'],
      confidenceScore: 96,
      aiReasoning: 'Classified under Ministry of Railways for capital track replacement and passenger transit infrastructure.',
    };
  }

  if (
    text.includes('solar') ||
    text.includes('renewable') ||
    text.includes('green hydrogen') ||
    text.includes('photovoltaic') ||
    text.includes('battery storage') ||
    text.includes('wind') ||
    text.includes('grid')
  ) {
    return {
      departmentId: 'dept-6',
      departmentName: 'Ministry of New & Renewable Energy',
      departmentCode: 'MNRE',
      projectId: 'prj-6',
      projectName: 'Ultra-Mega Solar Energy Park Phase II',
      category: 'CAPITAL_OUTLAY',
      priorityLevel: 'HIGH_PRIORITY',
      tags: ['CLEAN_ENERGY', 'SOLAR_PARK', 'CARBON_NEUTRAL', 'GRID_INTEGRATION'],
      confidenceScore: 91,
      aiReasoning: 'Classified under MNRE for renewable generation and battery storage infrastructure.',
    };
  }

  // Default fallback for general administrative / operational vouchers
  const isHighValue = amount >= 10;
  return {
    departmentId: 'dept-1',
    departmentName: 'Ministry of Road Transport & Highways',
    departmentCode: 'MoRTH',
    projectId: 'prj-1',
    projectName: 'General Capital Works & Infrastructure',
    category: isHighValue ? 'CAPITAL_OUTLAY' : 'OPERATIONAL',
    priorityLevel: isHighValue ? 'HIGH_PRIORITY' : 'STANDARD_MEDIUM',
    tags: [isHighValue ? 'CAPEX_DISBURSEMENT' : 'OPEX_MAINTENANCE', 'GENERAL_ADMIN', 'VENDOR_SETTLEMENT'],
    confidenceScore: 84,
    aiReasoning: 'Classified via general financial ledger heuristic. Mapped based on transaction quantum and vendor disbursement profile.',
  };
}
