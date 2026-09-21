import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedLanguage = 'en' | 'hi' | 'bn' | 'ta' | 'mr' | 'te' | 'gu';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English (Official)', region: 'National / Central' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'संघ की राजभाषा / Northern' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'West Bengal & Eastern' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'Tamil Nadu & Southern' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', region: 'Maharashtra & Western' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'Andhra Pradesh & Telangana' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'Gujarat & Western' },
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Nav & System
    'app.title': 'BudgetAI Gov',
    'app.tagline': 'AI-Based Budget Utilization & Expenditure Monitoring System',
    'nav.dashboard': 'Executive Dashboard',
    'nav.budgets': 'Budget Allocations',
    'nav.expenditure': 'Expenditure Tracking',
    'nav.fundReleases': 'Fund Releases',
    'nav.schemes': 'Schemes & Programs',
    'nav.projects': 'Project Tracking',
    'nav.anomalies': 'AI Anomalies & Vigilance',
    'nav.forecast': 'Spending Forecast',
    'nav.risks': 'Risk Analysis',
    'nav.alerts': 'Alerts & Notices',
    'nav.reports': 'Fiscal Reports',
    'nav.audit': 'Audit & Transparency',
    'nav.dataImport': 'Data Import & Batch',
    'nav.dataQuality': 'Data Quality Engine',
    'nav.admin': 'System Administration',
    'nav.profile': 'Officer Profile & Settings',

    // Dashboard & Roles
    'dash.title': 'Executive Financial Command Center',
    'dash.subtitle': 'Real-time multi-department budget utilization, divergence tracking, and AI anomaly oversight.',
    'dash.askAI': 'Ask BudgetAI',
    'dash.generateReport': 'Generate Executive Report',
    'dash.printDossier': 'Print Official Dossier',
    'dash.rolePerspective': 'Executive Role Perspective',
    'dash.ministerView': 'Cabinet / Minister View',
    'dash.financeView': 'Joint Secretary / Finance Officer View',
    'dash.clerkView': 'Department Accounts Clerk View',
    'dash.auditorView': 'Auditor & Vigilance View',

    // Metrics
    'metric.nationalOutlay': 'National Budget Outlay',
    'metric.disbursement': 'Disbursement Progress',
    'metric.absorptionRate': 'Fiscal Absorption Rate',
    'metric.unspentOutlay': 'Unspent Budget Outlay',
    'metric.criticalAnomalies': 'Critical Vigilance Anomalies',
    'metric.pendingApprovals': 'Pending Approval Workflows',
    'metric.vouchersProcessed': 'Daily Vouchers Processed',
    'metric.unmatchedHeads': 'Unmatched Head Warnings',
    'metric.dataQualityScore': 'Data Quality Score',
    'metric.utilizationBenchmark': 'Statutory Benchmark',

    // Common Actions
    'action.search': 'Search allocations, schemes, vouchers...',
    'action.filter': 'Filter Records',
    'action.export': 'Export Data',
    'action.print': 'Print Document',
    'action.approve': 'Approve & Sanction',
    'action.reject': 'Reject Proposal',
    'action.submit': 'Submit for Concurrence',
    'action.review': 'Review Case',
    'action.save': 'Save Changes',
    'action.refresh': 'Refresh Live Data',
    'action.switchRole': 'Switch Role',
    'action.syncNow': 'Sync Offline Queue',

    // Offline & Network
    'network.online': 'NIC GovNet Connected',
    'network.degraded': 'NIC GovNet Unstable',
    'network.offline': 'Offline Mode (IndexedDB Active)',
    'network.banner': 'Government Network Unstable — Running in Offline Mode with Cached Data from IndexedDB. Modifications are queued for automatic synchronization.',
  },

  hi: {
    // Nav & System
    'app.title': 'बजट एआई शासन',
    'app.tagline': 'एआई-आधारित बजट उपयोग एवं व्यय निगरानी प्रणाली',
    'nav.dashboard': 'कार्यकारी डैशबोर्ड',
    'nav.budgets': 'बजट आवंटन एवं स्वीकृति',
    'nav.expenditure': 'व्यय निगरानी',
    'nav.fundReleases': 'धनराशि विमुक्ति',
    'nav.schemes': 'योजनाएं एवं कार्यक्रम',
    'nav.projects': 'परियोजना ट्रैकिंग',
    'nav.anomalies': 'एआई विसंगतियां एवं सतर्कता',
    'nav.forecast': 'व्यय पूर्वानुमान',
    'nav.risks': 'वित्तीय जोखिम विश्लेषण',
    'nav.alerts': 'चेतावनी एवं सूचनाएं',
    'nav.reports': 'वित्तीय प्रतिवेदन',
    'nav.audit': 'लेखा परीक्षा एवं पारदर्शिता',
    'nav.dataImport': 'डेटा आयात एवं बैच',
    'nav.dataQuality': 'डेटा गुणवत्ता प्रणाली',
    'nav.admin': 'सिस्टम प्रशासन',
    'nav.profile': 'अधिकारी प्रोफाइल एवं सेटिंग्स',

    // Dashboard & Roles
    'dash.title': 'कार्यकारी वित्तीय कमान केंद्र',
    'dash.subtitle': 'वास्तविक समय में बहु-विभागीय बजट उपयोग, अंतर विश्लेषण और एआई विसंगति निगरानी।',
    'dash.askAI': 'बजट एआई से पूछें',
    'dash.generateReport': 'कार्यकारी रिपोर्ट बनाएं',
    'dash.printDossier': 'आधिकारिक डोजियर प्रिंट करें',
    'dash.rolePerspective': 'कार्यकारी पद दृष्टिकोण',
    'dash.ministerView': 'केंद्रीय मंत्री / कैबिनेट दृश्य',
    'dash.financeView': 'संयुक्त सचिव / वित्त अधिकारी दृश्य',
    'dash.clerkView': 'विभागीय लेखा लिपिक दृश्य',
    'dash.auditorView': 'लेखा परीक्षक / सतर्कता दृश्य',

    // Metrics
    'metric.nationalOutlay': 'राष्ट्रीय बजट परिव्यय',
    'metric.disbursement': 'संवितरण प्रगति',
    'metric.absorptionRate': 'राजकोषीय उपभोग दर',
    'metric.unspentOutlay': 'अव्ययित बजट शेष',
    'metric.criticalAnomalies': 'गंभीर सतर्कता विसंगतियां',
    'metric.pendingApprovals': 'लंबित अनुमोदन कार्यप्रवाह',
    'metric.vouchersProcessed': 'दैनिक प्रसंस्कृत वाउचर',
    'metric.unmatchedHeads': 'असंगत लेखा शीर्ष चेतावनी',
    'metric.dataQualityScore': 'डेटा गुणवत्ता सूचकांक',
    'metric.utilizationBenchmark': 'सांविधिक मानक',

    // Common Actions
    'action.search': 'आवंटन, योजनाएं, वाउचर खोजें...',
    'action.filter': 'फ़िल्टर करें',
    'action.export': 'डेटा निर्यात करें',
    'action.print': 'दस्तावेज़ प्रिंट करें',
    'action.approve': 'स्वीकृति प्रदान करें',
    'action.reject': 'प्रस्ताव अस्वीकार करें',
    'action.submit': 'सहमति हेतु प्रस्तुत करें',
    'action.review': 'प्रकरण की समीक्षा करें',
    'action.save': 'परिवर्तन सहेजें',
    'action.refresh': 'डेटा ताज़ा करें',
    'action.switchRole': 'पद बदलें',
    'action.syncNow': 'ऑफ़लाइन कतार सिंक करें',

    // Offline & Network
    'network.online': 'एनआईसी नेटवर्क कनेक्टेड',
    'network.degraded': 'एनआईसी नेटवर्क अस्थिर',
    'network.offline': 'ऑफ़लाइन मोड (IndexedDB सक्रिय)',
    'network.banner': 'शासकीय नेटवर्क अस्थिर है — IndexedDB से सुरक्षित डेटा के साथ ऑफ़लाइन कार्य हो रहा है। सभी परिवर्तन स्वतः सिंक हेतु कतारबद्ध हैं।',
  },

  bn: {
    // Nav & System
    'app.title': 'বাজেটএআই গভর্নমেন্ট',
    'app.tagline': 'এআই-ভিত্তিক বাজেট ব্যবহার এবং ব্যয় পর্যবেক্ষণ ব্যবস্থা',
    'nav.dashboard': 'নির্বাহী ড্যাশবোর্ড',
    'nav.budgets': 'বাজেট বরাদ্দ ও অনুমোদন',
    'nav.expenditure': 'ব্যয় ট্র্যাকিং',
    'nav.fundReleases': 'তহবিল ছাড়',
    'nav.schemes': 'প্রকল্প ও কর্মসূচি',
    'nav.projects': 'প্রকল্প অগ্রগতি',
    'nav.anomalies': 'এআই অসঙ্গতি ও নজরদারি',
    'nav.forecast': 'ব্যয়ের পূর্বাভাস',
    'nav.risks': 'ঝুঁকি বিশ্লেষণ',
    'nav.alerts': 'বিজ্ঞপ্তি ও সতর্কতা',
    'nav.reports': 'আর্থিক প্রতিবেদন',
    'nav.audit': 'নিরীক্ষা ও স্বচ্ছতা',
    'nav.dataImport': 'তথ্য আমদানি',
    'nav.dataQuality': 'তথ্য গুণমান',
    'nav.admin': 'সিস্টেম প্রশাসন',
    'nav.profile': 'কর্মকর্তার প্রোফাইল',

    // Dashboard & Roles
    'dash.title': 'আর্থিক নিয়ন্ত্রণ ও পর্যবেক্ষণ কেন্দ্র',
    'dash.subtitle': 'রিয়েল-টাইম বহু-বিভাগীয় বাজেট ব্যবহার এবং এআই পর্যবেক্ষণ।',
    'dash.askAI': 'বাজেট এআই প্রশ্ন করুন',
    'dash.generateReport': 'প্রতিবেদন তৈরি করুন',
    'dash.printDossier': 'সরকারি নথি প্রিন্ট করুন',
    'dash.rolePerspective': 'পদমর্যাদা ভিত্তিক দৃশ্য',
    'dash.ministerView': 'মন্ত্রী / মন্ত্রিসভা ভিউ',
    'dash.financeView': 'যুগ্ম সচিব / অর্থ কর্মকর্তা ভিউ',
    'dash.clerkView': 'বিভাগীয় হিসাব কেরানি ভিউ',
    'dash.auditorView': 'নিরীক্ষক / সতর্কতা ভিউ',

    // Metrics
    'metric.nationalOutlay': 'জাতীয় বাজেট বরাদ্দ',
    'metric.disbursement': 'বিতরণ অগ্রগতি',
    'metric.absorptionRate': 'ব্যবহারের হার',
    'metric.unspentOutlay': 'অব্যবহৃত অর্থ',
    'metric.criticalAnomalies': 'গুরুত্বপূর্ণ অসঙ্গতি',
    'metric.pendingApprovals': 'অপেক্ষমান অনুমোদন',
    'metric.vouchersProcessed': 'প্রক্রিয়াকৃত ভাউচার',
    'metric.unmatchedHeads': 'অসংগতিপূর্ণ হিসাব শিরোনাম',
    'metric.dataQualityScore': 'তথ্য নির্ভুলতা স্কোর',
    'metric.utilizationBenchmark': 'লক্ষ্যমাত্রা মান',

    // Common Actions
    'action.search': 'অনুসন্ধান করুন...',
    'action.filter': 'ফিল্টার',
    'action.export': 'রপ্তানি',
    'action.print': 'প্রিন্ট',
    'action.approve': 'অনুমোদন করুন',
    'action.reject': 'প্রত্যাখ্যান করুন',
    'action.submit': 'জমা দিন',
    'action.review': 'পর্যালোচনা করুন',
    'action.save': 'সংরক্ষণ করুন',
    'action.refresh': 'রিফ্রেশ',
    'action.switchRole': 'ভূমিকা পরিবর্তন',
    'action.syncNow': 'সিঙ্ক করুন',

    // Offline & Network
    'network.online': 'এনআইসি নেটওয়ার্ক সক্রিয়',
    'network.degraded': 'নেটওয়ার্ক দুর্বল',
    'network.offline': 'অফলাইন মোড (IndexedDB)',
    'network.banner': 'সরকারি নেটওয়ার্ক সংযোগ বিচ্ছিন্ন — অফলাইনে IndexedDB থেকে ডেটা প্রদর্শিত হচ্ছে।',
  },

  ta: {
    // Nav & System
    'app.title': 'பட்ஜெட் ஏஐ அரசு',
    'app.tagline': 'செயற்கை நுண்ணறிவு அடிப்படையிலான நிதி ஒதுக்கீடு மற்றும் செலவின கண்காணிப்பு',
    'nav.dashboard': 'செயல்பாட்டு டாஷ்போர்டு',
    'nav.budgets': 'நிதி ஒதுக்கீடுகள்',
    'nav.expenditure': 'செலவினக் கண்காணிப்பு',
    'nav.fundReleases': 'நிதி விடுவிப்பு',
    'nav.schemes': 'அரசுத் திட்டங்கள்',
    'nav.projects': 'திட்டங்கள் கண்காணிப்பு',
    'nav.anomalies': 'ஏஐ முரண்பாடுகள் மற்றும் தணிக்கை',
    'nav.forecast': 'செலவின முன்கணிப்பு',
    'nav.risks': 'இடர் பகுப்பாய்வு',
    'nav.alerts': 'எச்சரிக்கைகள்',
    'nav.reports': 'நிதி அறிக்கைகள்',
    'nav.audit': 'தணிக்கை மற்றும் வெளிப்படைத்தன்மை',
    'nav.dataImport': 'தரவு இறக்குமதி',
    'nav.dataQuality': 'தரவுத் தரம்',
    'nav.admin': 'நிர்வாக அமைப்புகள்',
    'nav.profile': 'அதிகாரி சுயவிவரம்',

    // Dashboard & Roles
    'dash.title': 'நிதி கட்டளை மற்றும் கண்காணிப்பு மையம்',
    'dash.subtitle': 'நிகழ்நேர பல துறை பட்ஜெட் பயன்பாடு மற்றும் முரண்பாடுகள் கண்காணிப்பு.',
    'dash.askAI': 'பட்ஜெட் ஏஐ-யிடம் கேளுங்கள்',
    'dash.generateReport': 'அறிக்கை உருவாக்கவும்',
    'dash.printDossier': 'அரசு ஆவணத்தை அச்சிடு',
    'dash.rolePerspective': 'அதிகாரப் பார்வை',
    'dash.ministerView': 'அமைச்சர் / அமைச்சரவைப் பார்வை',
    'dash.financeView': 'நிதித்துறை அதிகாரி பார்வை',
    'dash.clerkView': 'துறை கணக்கு எழுத்தர் பார்வை',
    'dash.auditorView': 'தணிக்கையாளர் பார்வை',

    // Metrics
    'metric.nationalOutlay': 'மொத்த நிதி ஒதுக்கீடு',
    'metric.disbursement': 'வழங்கல் முன்னேற்றம்',
    'metric.absorptionRate': 'பயன்பாட்டு விகிதம்',
    'metric.unspentOutlay': 'செலவிடப்படாத நிதி',
    'metric.criticalAnomalies': 'முக்கிய முரண்பாடுகள்',
    'metric.pendingApprovals': 'நிலுவையில் உள்ள ஒப்புதல்கள்',
    'metric.vouchersProcessed': 'செயலாக்கப்பட்ட சான்றுகள்',
    'metric.unmatchedHeads': 'பொருந்தாத தலைப்புகள்',
    'metric.dataQualityScore': 'தரவுத் தர மதிப்பெண்',
    'metric.utilizationBenchmark': 'சட்டப்பூர்வ இலக்கு',

    // Common Actions
    'action.search': 'தேடுக...',
    'action.filter': 'வடிகட்டுக',
    'action.export': 'ஏற்றுமதி செய்க',
    'action.print': 'அச்சிடுக',
    'action.approve': 'ஒப்புதல் அளிக்க',
    'action.reject': 'நிராகரிக்க',
    'action.submit': 'சமர்ப்பிக்க',
    'action.review': 'ஆய்வு செய்க',
    'action.save': 'சேமிக்க',
    'action.refresh': 'புதுப்பிக்க',
    'action.switchRole': 'பொறுப்பு மாற்றம்',
    'action.syncNow': 'ஒத்திசைக்க',

    // Offline & Network
    'network.online': 'இணைய இணைப்பு உள்ளது',
    'network.degraded': 'வலைப்பின்னல் பலவீனமானது',
    'network.offline': 'ஆஃப்லைன் முறை (IndexedDB)',
    'network.banner': 'அரசு இணைய இணைப்பு இல்லை — IndexedDB தரவுகளுடன் ஆஃப்லைனில் செயல்படுகிறது.',
  },

  mr: {
    // Nav & System
    'app.title': 'बजेट एआय शासन',
    'app.tagline': 'एआय-आधारित अंदाजपत्रक वापर व खर्च सनियंत्रण प्रणाली',
    'nav.dashboard': 'मुख्य डॅशबोर्ड',
    'nav.budgets': 'अर्थसंकल्पीय तरतूद व मंजुरी',
    'nav.expenditure': 'खर्च सनियंत्रण',
    'nav.fundReleases': 'निधी वितरण',
    'nav.schemes': 'शासकीय योजना',
    'nav.projects': 'प्रकल्प प्रगती',
    'nav.anomalies': 'एआय विसंगती व दक्षता',
    'nav.forecast': 'खर्चाचा अंदाज',
    'nav.risks': 'वित्तीय जोखीम',
    'nav.alerts': 'सूचना व सतर्कता',
    'nav.reports': 'आर्थिक अहवाल',
    'nav.audit': 'लेखापरीक्षण व पारदर्शकता',
    'nav.dataImport': 'डेटा आयात',
    'nav.dataQuality': 'डेटा गुणवत्ता',
    'nav.admin': 'प्रशासन',
    'nav.profile': 'अधिकारी प्रोफाइल',

    // Dashboard & Roles
    'dash.title': 'आर्थिक नियंत्रण व सनियंत्रण केंद्र',
    'dash.subtitle': 'रिअल-टाइम विविध विभागांचा अर्थसंकल्पीय खर्च आणि एआय विसंगती सनियंत्रण.',
    'dash.askAI': 'बजेट एआय ला विचारा',
    'dash.generateReport': 'अहवाल तयार करा',
    'dash.printDossier': 'शासकीय दस्तावेज मुद्रित करा',
    'dash.rolePerspective': 'पदनिहाय दृष्टिकोन',
    'dash.ministerView': 'मंत्री / मंत्रिमंडळ दृश्य',
    'dash.financeView': 'वित्त अधिकारी दृश्य',
    'dash.clerkView': 'विभागीय लिपिक दृश्य',
    'dash.auditorView': 'लेखापरीक्षक दृश्य',

    // Metrics
    'metric.nationalOutlay': 'एकूण अर्थसंकल्पीय तरतूद',
    'metric.disbursement': 'वितरण प्रगती',
    'metric.absorptionRate': 'खर्च प्रमाण दर',
    'metric.unspentOutlay': 'अखर्चिक निधी',
    'metric.criticalAnomalies': 'गंभीर विसंगती',
    'metric.pendingApprovals': 'प्रलंबित मंजुऱ्या',
    'metric.vouchersProcessed': 'प्रक्रिया केलेले व्हाउचर्स',
    'metric.unmatchedHeads': 'विसंगत लेखाशीर्ष चेतावणी',
    'metric.dataQualityScore': 'डेटा गुणवत्ता गुणांक',
    'metric.utilizationBenchmark': 'वैधानिक प्रमाणक',

    // Common Actions
    'action.search': 'शोधा...',
    'action.filter': 'फिल्टर',
    'action.export': 'निर्यात',
    'action.print': 'मुद्रित करा',
    'action.approve': 'मंजूर करा',
    'action.reject': 'नाकारा',
    'action.submit': 'सादर करा',
    'action.review': 'पुनरावलोकन',
    'action.save': 'जतन करा',
    'action.refresh': 'रिफ्रेश',
    'action.switchRole': 'भूमिका बदला',
    'action.syncNow': 'सिंक करा',

    // Offline & Network
    'network.online': 'एनआयसी नेटवर्क सुरू',
    'network.degraded': 'नेटवर्क अस्थिर',
    'network.offline': 'ऑफलाइन मोड (IndexedDB)',
    'network.banner': 'शासकीय नेटवर्क अस्थिर — स्थानिक IndexedDB वरून ऑफलाइन कार्यरत. सर्व बदल पुन्हा जोडल्यावर सिंक होतील.',
  },

  te: {
    // Nav & System
    'app.title': 'బడ్జెట్ ఏఐ ప్రభుత్వం',
    'app.tagline': 'ఏఐ ఆధారిత బడ్జెట్ వినియోగం మరియు వ్యయ పర్యవేక్షణ వ్యవస్థ',
    'nav.dashboard': 'ఎగ్జిక్యూటివ్ డ్యాష్‌బోర్డ్',
    'nav.budgets': 'బడ్జెట్ కేటాయింపులు',
    'nav.expenditure': 'ఖర్చుల ట్రాకింగ్',
    'nav.fundReleases': 'నిధుల విడుదల',
    'nav.schemes': 'పథకాలు మరియు కార్యక్రమాలు',
    'nav.projects': 'ప్రాజెక్ట్ ట్రాకింగ్',
    'nav.anomalies': 'ఏఐ వ్యత్యాసాలు & విజిలెన్స్',
    'nav.forecast': 'వ్యయ అంచనా',
    'nav.risks': 'రిస్క్ విశ్లేషణ',
    'nav.alerts': 'హెచ్చరికలు',
    'nav.reports': 'ఆర్థిక నివేదికలు',
    'nav.audit': 'ఆడిట్ & పారదర్శకత',
    'nav.dataImport': 'డేటా దిగుమతి',
    'nav.dataQuality': 'డేటా నాణ్యత',
    'nav.admin': 'సిస్టమ్ అడ్మినిస్ట్రేషన్',
    'nav.profile': 'అధికారి ప్రొఫైల్',

    // Dashboard & Roles
    'dash.title': 'ఆర్థిక కమాండ్ సెంటర్',
    'dash.subtitle': 'రియల్ టైమ్ బడ్జెట్ వినియోగం మరియు ఏఐ వ్యత్యాసాల పర్యవేక్షణ.',
    'dash.askAI': 'బడ్జెట్ ఏఐని అడగండి',
    'dash.generateReport': 'నివేదిక రూపొందించండి',
    'dash.printDossier': 'పత్రాన్ని ముద్రించండి',
    'dash.rolePerspective': 'హోదా ఆధారిత వీక్షణ',
    'dash.ministerView': 'మంత్రి / క్యాబినెట్ వీక్షణ',
    'dash.financeView': 'ఆర్థిక అధికారి వీక్షణ',
    'dash.clerkView': 'డిపార్ట్‌మెంట్ క్లర్క్ వీక్షణ',
    'dash.auditorView': 'ఆడిటర్ వీక్షణ',

    // Metrics
    'metric.nationalOutlay': 'మొత్తం బడ్జెట్ వ్యయం',
    'metric.disbursement': 'పంపిణీ పురోగతి',
    'metric.absorptionRate': 'వినియోగ రేటు',
    'metric.unspentOutlay': 'ఖర్చు చేయని నిధులు',
    'metric.criticalAnomalies': 'కీలక వ్యత్యాసాలు',
    'metric.pendingApprovals': 'పెండింగ్ ఆమోదాలు',
    'metric.vouchersProcessed': 'ప్రాసెస్ చేసిన వోచర్లు',
    'metric.unmatchedHeads': 'సరిపోలని శీర్షికలు',
    'metric.dataQualityScore': 'డేటా నాణ్యత స్కోరు',
    'metric.utilizationBenchmark': 'చట్టబద్ధమైన లక్ష్యం',

    // Common Actions
    'action.search': 'శోధించండి...',
    'action.filter': 'ఫిల్టర్',
    'action.export': 'ఎగుమతి',
    'action.print': 'ప్రింట్',
    'action.approve': 'ఆమోదించండి',
    'action.reject': 'తిరస్కరించండి',
    'action.submit': 'సమర్పించండి',
    'action.review': 'సమీక్షించండి',
    'action.save': 'సేవ్ చేయండి',
    'action.refresh': 'రిఫ్రెష్',
    'action.switchRole': 'పాత్ర మార్పు',
    'action.syncNow': 'సింక్ చేయండి',

    // Offline & Network
    'network.online': 'నెట్‌వర్క్ కనెక్ట్ అయింది',
    'network.degraded': 'నెట్‌వర్క్ బలహీనంగా ఉంది',
    'network.offline': 'ఆఫ్‌లైన్ మోడ్ (IndexedDB)',
    'network.banner': 'ప్రభుత్వ నెట్‌వర్క్ అందుబాటులో లేదు — IndexedDB డేటాతో ఆఫ్‌లైన్‌లో నడుస్తోంది.',
  },

  gu: {
    // Nav & System
    'app.title': 'બજેટ એઆઈ શાસન',
    'app.tagline': 'એઆઈ-આધારિત બજેટ વપરાશ અને ખર્ચ મોનિટરિંગ સિસ્ટમ',
    'nav.dashboard': 'એક્ઝિક્યુટિવ ડેશબોર્ડ',
    'nav.budgets': 'બજેટ ફાળવણી અને મંજૂરી',
    'nav.expenditure': 'ખર્ચ ટ્રેકિંગ',
    'nav.fundReleases': 'ભંડોળ વિતરણ',
    'nav.schemes': 'યોજનાઓ અને કાર્યક્રમો',
    'nav.projects': 'પ્રોજેક્ટ ટ્રેકિંગ',
    'nav.anomalies': 'એઆઈ વિસંગતતાઓ',
    'nav.forecast': 'ખર્ચ પૂર્વાનુમાન',
    'nav.risks': 'જોખમ વિશ્લેષણ',
    'nav.alerts': 'ચેતવણીઓ',
    'nav.reports': 'નાણાકીય અહેવાલો',
    'nav.audit': 'ઓડિટ અને પારદર્શિતા',
    'nav.dataImport': 'ડેટા આયાત',
    'nav.dataQuality': 'ડેટા ગુણવત્તા',
    'nav.admin': 'સિસ્ટમ વહીવટ',
    'nav.profile': 'અધિકારી પ્રોફાઇલ',

    // Dashboard & Roles
    'dash.title': 'નાણાકીય કમાન્ડ સેન્ટર',
    'dash.subtitle': 'રીયલ-ટાઇમ બહુ-વિભાગીય બજેટ વપરાશ અને એઆઈ વિસંગતતા નિરીક્ષણ.',
    'dash.askAI': 'બજેટ એઆઈ ને પૂછો',
    'dash.generateReport': 'અહેવાલ બનાવો',
    'dash.printDossier': 'દસ્તાવેજ પ્રિન્ટ કરો',
    'dash.rolePerspective': 'હોદ્દા મુજબ દૃષ્ટિકોણ',
    'dash.ministerView': 'મંત્રીશ્રી / મંત્રીમંડળ દૃશ્ય',
    'dash.financeView': 'નાણા અધિકારી દૃશ્ય',
    'dash.clerkView': 'વિભાગીય કારકુન દૃશ્ય',
    'dash.auditorView': 'ઓડિટર દૃશ્ય',

    // Metrics
    'metric.nationalOutlay': 'કુલ બજેટ ખર્ચ',
    'metric.disbursement': 'ચુકવણી પ્રગતિ',
    'metric.absorptionRate': 'ખર્ચ વપરાશ દર',
    'metric.unspentOutlay': 'વણવપરાયેલ બજેટ',
    'metric.criticalAnomalies': 'ગંભીર વિસંગતતાઓ',
    'metric.pendingApprovals': 'બાકી મંજૂરીઓ',
    'metric.vouchersProcessed': 'પ્રોસેસ થયેલ વાઉચર',
    'metric.unmatchedHeads': 'અસંગત લેખાશીર્ષક',
    'metric.dataQualityScore': 'ડેટા ગુણવત્તા સ્કોર',
    'metric.utilizationBenchmark': 'લક્ષ્યાંક ધોરણ',

    // Common Actions
    'action.search': 'શોધો...',
    'action.filter': 'ફિલ્ટર',
    'action.export': 'નિકાસ',
    'action.print': 'પ્રિન્ટ કરો',
    'action.approve': 'મંજૂર કરો',
    'action.reject': 'અસ્વીકાર કરો',
    'action.submit': 'રજૂ કરો',
    'action.review': 'સમીક્ષા કરો',
    'action.save': 'સાચવો',
    'action.refresh': 'તાજું કરો',
    'action.switchRole': 'હોદ્દો બદલો',
    'action.syncNow': 'સિન્ક કરો',

    // Offline & Network
    'network.online': 'નેટવર્ક કનેક્ટેડ',
    'network.degraded': 'નેટવર્ક ધીમું છે',
    'network.offline': 'ઓફલાઇન મોડ (IndexedDB)',
    'network.banner': 'સરકારી નેટવર્ક અસ્થિર છે — IndexedDB પરથી ઓફલાઇન કામગીરી ચાલુ છે.',
  },
};

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, defaultText?: string) => string;
  languages: LanguageOption[];
  currentLanguageOption: LanguageOption;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('budgetai_language');
    if (saved && ['en', 'hi', 'bn', 'ta', 'mr', 'te', 'gu'].includes(saved)) {
      return saved as SupportedLanguage;
    }
    return 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('budgetai_language', lang);
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS['en'];
    if (langDict[key]) {
      return langDict[key];
    }
    // Fallback to English
    if (TRANSLATIONS['en'][key]) {
      return TRANSLATIONS['en'][key];
    }
    return defaultText || key;
  };

  const currentLanguageOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: SUPPORTED_LANGUAGES,
        currentLanguageOption,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return ctx;
};
