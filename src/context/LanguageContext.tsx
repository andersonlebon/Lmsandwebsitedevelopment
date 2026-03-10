import React, { createContext, useContext, useState, useCallback } from 'react';

export type Lang = 'en' | 'fr';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
});

// ============================================================
// TRANSLATIONS — English & French
// ============================================================
const translations: Record<string, Record<Lang, string>> = {
  // ── Navbar ──
  'nav.home': { en: 'Home', fr: 'Accueil' },
  'nav.about': { en: 'About', fr: 'A propos' },
  'nav.programs': { en: 'Programs', fr: 'Programmes' },
  'nav.contact': { en: 'Contact', fr: 'Contact' },
  'nav.studentPortal': { en: 'Student Portal', fr: 'Portail Etudiant' },
  'nav.dashboard': { en: 'Dashboard', fr: 'Tableau de bord' },
  'nav.adminDashboard': { en: 'Admin Dashboard', fr: 'Tableau de bord Admin' },

  // ── Hero ──
  'hero.badge': { en: 'AGAPD/Asbl — BTC Goma, Nord-Kivu, DRC', fr: 'AGAPD/Asbl — BTC Goma, Nord-Kivu, RDC' },
  'hero.line1_1': { en: 'Learn. Grow.', fr: 'Apprendre. Grandir.' },
  'hero.line2_1': { en: 'Lead the World.', fr: 'Diriger le Monde.' },
  'hero.line1_2': { en: 'Master Languages,', fr: 'Maîtrisez les Langues,' },
  'hero.line2_2': { en: 'Master Your Future.', fr: 'Maîtrisez Votre Avenir.' },
  'hero.line1_3': { en: 'Skills for Life,', fr: 'Des Compétences pour la Vie,' },
  'hero.line2_3': { en: 'Success for All.', fr: 'Le Succès pour Tous.' },
  'hero.subtitle': { en: 'The Brotherly Training Center — École de Langues et Métiers — empowering the youth of Goma with world-class language and vocational training.', fr: 'Le Brotherly Training Center — École de Langues et Métiers — forme la jeunesse de Goma avec des formations linguistiques et professionnelles de classe mondiale.' },
  'hero.explorePrograms': { en: 'Explore Programs', fr: 'Explorer les Programmes' },
  'hero.aboutBtc': { en: 'About BTC', fr: 'A propos de BTC' },
  'hero.scroll': { en: 'Scroll', fr: 'Défiler' },
  'hero.activeStudents': { en: 'Active Students', fr: 'Étudiants Actifs' },
  'hero.expertTeachers': { en: 'Expert Teachers', fr: 'Enseignants Experts' },
  'hero.topRated': { en: 'Top Rated', fr: 'Mieux Notés' },

  // ── Stats ──
  'stats.studentsEnrolled': { en: 'Students Enrolled', fr: 'Étudiants Inscrits' },
  'stats.sinceFoundation': { en: 'Since founding', fr: 'Depuis la fondation' },
  'stats.activePrograms': { en: 'Active Programs', fr: 'Programmes Actifs' },
  'stats.languagesAndTrades': { en: 'Languages & trades', fr: 'Langues et métiers' },
  'stats.languagesTaught': { en: 'Languages Taught', fr: 'Langues Enseignées' },
  'stats.includingDialects': { en: 'Including local dialects', fr: 'Y compris les dialectes locaux' },
  'stats.jobPlacementRate': { en: 'Job Placement Rate', fr: 'Taux de Placement' },
  'stats.forGraduates': { en: 'For graduates', fr: 'Pour les diplômés' },

  // ── About Preview ──
  'about.badge': { en: 'About BTC', fr: 'A propos de BTC' },
  'about.title': { en: 'Empowering Goma\'s Youth Through Quality Education', fr: 'Autonomiser la Jeunesse de Goma par une Éducation de Qualité' },
  'about.p1': { en: 'Founded in Goma, North Kivu, the Brotherly Training Center (BTC) is a premier institution dedicated to providing world-class language and vocational training in the heart of DRC.', fr: 'Fondé à Goma, Nord-Kivu, le Brotherly Training Center (BTC) est une institution de premier plan dédiée à offrir des formations linguistiques et professionnelles de classe mondiale au coeur de la RDC.' },
  'about.p2': { en: 'Our mission is to equip students with practical skills that open doors to local and international opportunities, foster economic independence, and build a stronger community.', fr: 'Notre mission est d\'équiper les étudiants avec des compétences pratiques qui ouvrent les portes aux opportunités locales et internationales, favorisent l\'indépendance économique et construisent une communauté plus forte.' },
  'about.bullet1': { en: 'Accredited language certifications (DELF, IELTS prep)', fr: 'Certifications linguistiques accréditées (DELF, préparation IELTS)' },
  'about.bullet2': { en: 'Practical vocational and technical skills', fr: 'Compétences professionnelles et techniques pratiques' },
  'about.bullet3': { en: 'Modern digital learning resources', fr: 'Ressources d\'apprentissage numériques modernes' },
  'about.bullet4': { en: 'Dedicated career placement support', fr: 'Accompagnement dédié au placement professionnel' },
  'about.learnMore': { en: 'Learn More About BTC', fr: 'En Savoir Plus sur BTC' },
  'about.isoCertified': { en: 'ISO Certified', fr: 'Certifié ISO' },
  'about.qualityEducation': { en: 'Quality Education', fr: 'Éducation de Qualité' },
  'about.yearsExcellence': { en: 'Years of Excellence', fr: 'Années d\'Excellence' },

  // ── Programs ──
  'programs.badge': { en: 'Our Programs', fr: 'Nos Programmes' },
  'programs.title': { en: 'Courses Designed for Your Success', fr: 'Des Cours Conçus pour Votre Réussite' },
  'programs.subtitle': { en: 'From language mastery to digital skills, our programs are built to help you thrive in today\'s competitive world.', fr: 'De la maîtrise des langues aux compétences numériques, nos programmes sont conçus pour vous aider à réussir dans le monde compétitif d\'aujourd\'hui.' },
  'programs.viewAll': { en: 'View All Programs', fr: 'Voir Tous les Programmes' },
  'programs.learnMore': { en: 'Learn more', fr: 'En savoir plus' },

  // Program titles
  'program.english': { en: 'English Language', fr: 'Langue Anglaise' },
  'program.english.desc': { en: 'Master English for global communication, business, and academic success.', fr: 'Maîtrisez l\'anglais pour la communication globale, les affaires et la réussite académique.' },
  'program.french': { en: 'French Language', fr: 'Langue Française' },
  'program.french.desc': { en: 'Learn French — the diplomatic language and key to professional opportunities in Africa.', fr: 'Apprenez le français — la langue diplomatique et clé des opportunités professionnelles en Afrique.' },
  'program.swahili': { en: 'Swahili Language', fr: 'Langue Swahili' },
  'program.swahili.desc': { en: 'Communicate across East & Central Africa with professional Swahili skills.', fr: 'Communiquez à travers l\'Afrique de l\'Est et Centrale avec des compétences professionnelles en Swahili.' },
  'program.computer': { en: 'Computer Science', fr: 'Informatique' },
  'program.computer.desc': { en: 'Web development, programming, office software, and digital literacy.', fr: 'Développement web, programmation, logiciels bureautiques et littératie numérique.' },
  'program.accounting': { en: 'Accounting & Finance', fr: 'Comptabilité et Finance' },
  'program.accounting.desc': { en: 'Professional accounting skills for businesses and organizations.', fr: 'Compétences comptables professionnelles pour les entreprises et organisations.' },
  'program.design': { en: 'Graphic Design', fr: 'Design Graphique' },
  'program.design.desc': { en: 'Creative design using Adobe Suite for branding, print, and digital media.', fr: 'Design créatif utilisant Adobe Suite pour le branding, l\'impression et les médias numériques.' },

  // ── Why BTC ──
  'why.badge': { en: 'Why Choose BTC?', fr: 'Pourquoi Choisir BTC ?' },
  'why.title': { en: 'The #1 Training Center in Goma', fr: 'Le Centre de Formation #1 à Goma' },
  'why.subtitle': { en: 'We don\'t just teach — we transform. With experienced staff, modern facilities, and a student-first approach, BTC is where futures are built.', fr: 'Nous n\'enseignons pas seulement — nous transformons. Avec un personnel expérimenté, des installations modernes et une approche centrée sur l\'étudiant, BTC est l\'endroit où les avenirs se construisent.' },
  'why.certifiedPrograms': { en: 'Certified Programs', fr: 'Programmes Certifiés' },
  'why.certifiedPrograms.desc': { en: 'Internationally recognized certificates accepted by employers worldwide.', fr: 'Certificats reconnus internationalement et acceptés par les employeurs du monde entier.' },
  'why.expertInstructors': { en: 'Expert Staff', fr: 'Personnel Expert' },
  'why.expertInstructors.desc': { en: 'Native and bilingual teachers with years of professional experience.', fr: 'Enseignants natifs et bilingues avec des années d\'expérience professionnelle.' },
  'why.blendedLearning': { en: 'Blended Learning', fr: 'Apprentissage Mixte' },
  'why.blendedLearning.desc': { en: 'Combine in-person and online sessions for maximum flexibility.', fr: 'Combinez les sessions en personne et en ligne pour une flexibilité maximale.' },
  'why.safeEnvironment': { en: 'Safe Environment', fr: 'Environnement Sûr' },
  'why.safeEnvironment.desc': { en: 'Inclusive, supportive, and secure learning community for all students.', fr: 'Communauté d\'apprentissage inclusive, bienveillante et sécurisée pour tous les étudiants.' },
  'why.careerSupport': { en: 'Career Support', fr: 'Soutien Carrière' },
  'why.careerSupport.desc': { en: 'Job placement assistance and professional development workshops.', fr: 'Aide au placement professionnel et ateliers de développement professionnel.' },
  'why.fastProgress': { en: 'Fast Progress', fr: 'Progrès Rapide' },
  'why.fastProgress.desc': { en: 'Intensive and accelerated programs designed for busy professionals.', fr: 'Programmes intensifs et accélérés conçus pour les professionnels occupés.' },
  'why.onlineInPerson': { en: 'Online & In-Person', fr: 'En Ligne et En Personne' },
  'why.hybridPlatform': { en: 'Study from Goma or anywhere with our hybrid platform', fr: 'Étudiez depuis Goma ou partout avec notre plateforme hybride' },

  // ── Testimonials ──
  'testimonials.title': { en: 'What Our Students Say', fr: 'Ce Que Disent Nos Étudiants' },
  'testimonials.subtitle': { en: 'Real stories from BTC graduates who transformed their lives.', fr: 'De vraies histoires de diplômés BTC qui ont transformé leur vie.' },

  // ── Partners ──
  'partners.trustedBy': { en: 'TRUSTED BY', fr: 'ILS NOUS FONT CONFIANCE' },
  'partners.title': { en: 'Our Partners & Affiliations', fr: 'Nos Partenaires et Affiliations' },

  // ── Student Portal Promo ──
  'portal.badge': { en: 'Student Experience', fr: 'Expérience Étudiante' },
  'portal.title': { en: 'A Complete Learning Platform', fr: 'Une Plateforme d\'Apprentissage Complète' },
  'portal.subtitle': { en: 'Beyond the classroom — access your courses, AI tutoring, certificates, job board, and community from one platform.', fr: 'Au-delà de la classe — accédez à vos cours, tutorat IA, certificats, offres d\'emploi et communauté depuis une seule plateforme.' },
  'portal.courseDashboard': { en: 'Course Dashboard', fr: 'Tableau de Bord des Cours' },
  'portal.courseDashboard.desc': { en: 'Track progress, access lessons, submit assignments, and review grades all in one place.', fr: 'Suivez votre progression, accédez aux leçons, soumettez vos devoirs et consultez vos notes en un seul endroit.' },
  'portal.aiAssistant': { en: 'AI Learning Assistant', fr: 'Assistant IA d\'Apprentissage' },
  'portal.aiAssistant.desc': { en: 'Get instant help with your studies — practice languages, explain concepts, and prepare for exams.', fr: 'Obtenez de l\'aide instantanée — pratiquez les langues, comprenez les concepts et préparez vos examens.' },
  'portal.certificates': { en: 'Digital Certificates', fr: 'Certificats Numériques' },
  'portal.certificates.desc': { en: 'Earn verifiable certificates with unique IDs. Share them on LinkedIn and with employers.', fr: 'Obtenez des certificats vérifiables avec des identifiants uniques. Partagez-les sur LinkedIn.' },
  'portal.jobBoard': { en: 'Job Placement Board', fr: 'Tableau d\'Offres d\'Emploi' },
  'portal.jobBoard.desc': { en: 'Access exclusive job listings from NGOs, companies, and organizations hiring BTC graduates.', fr: 'Accédez aux offres d\'emploi exclusives des ONG, entreprises et organisations recrutant des diplômés BTC.' },
  'portal.community': { en: 'Student Community', fr: 'Communauté Étudiante' },
  'portal.community.desc': { en: 'Join study groups, participate in discussions, and network with fellow students.', fr: 'Rejoignez des groupes d\'étude, participez aux discussions et réseautez avec vos camarades.' },
  'portal.blendedLearning': { en: 'Blended Learning', fr: 'Apprentissage Mixte' },
  'portal.blendedLearning.desc': { en: 'Attend in-person classes or study online — our platform supports both seamlessly.', fr: 'Assistez aux cours en personne ou étudiez en ligne — notre plateforme supporte les deux.' },
  'portal.explore': { en: 'Explore', fr: 'Explorer' },
  'portal.enter': { en: 'Enter Student Portal', fr: 'Accéder au Portail Étudiant' },

  // ── CTA ──
  'cta.title': { en: 'Ready to Start Your Journey?', fr: 'Prêt à Commencer Votre Parcours ?' },
  'cta.subtitle': { en: 'Join 500+ students already learning at BTC. Enrollment is open — classes start every month in Goma, DRC.', fr: 'Rejoignez plus de 500 étudiants qui apprennent déjà au BTC. Les inscriptions sont ouvertes — les cours commencent chaque mois à Goma, RDC.' },
  'cta.enrollNow': { en: 'Enroll Now', fr: 'S\'inscrire Maintenant' },
  'cta.browsePrograms': { en: 'Browse Programs', fr: 'Parcourir les Programmes' },

  // ── Footer ──
  'footer.description': { en: 'École de Langues et Métiers — empowering the youth of Goma, DRC with world-class language and vocational training.', fr: 'École de Langues et Métiers — formant la jeunesse de Goma, RDC avec des formations linguistiques et professionnelles de classe mondiale.' },
  'footer.quickLinks': { en: 'Quick Links', fr: 'Liens Rapides' },
  'footer.ourPrograms': { en: 'Our Programs', fr: 'Nos Programmes' },
  'footer.contactUs': { en: 'Contact Us', fr: 'Contactez-nous' },
  'footer.officeHours': { en: 'Office Hours', fr: 'Heures d\'Ouverture' },
  'footer.rights': { en: 'All rights reserved.', fr: 'Tous droits réservés.' },

  // ── Contact Page ──
  'contact.title': { en: 'Get In Touch', fr: 'Contactez-nous' },
  'contact.subtitle': { en: 'Have questions about our programs? Ready to enroll? We\'re here to help!', fr: 'Des questions sur nos programmes ? Prêt à vous inscrire ? Nous sommes là pour vous aider !' },
  'contact.name': { en: 'Full Name', fr: 'Nom Complet' },
  'contact.email': { en: 'Email Address', fr: 'Adresse Email' },
  'contact.phone': { en: 'Phone Number', fr: 'Numéro de Téléphone' },
  'contact.subject': { en: 'Subject', fr: 'Sujet' },
  'contact.message': { en: 'Message', fr: 'Message' },
  'contact.send': { en: 'Send Message', fr: 'Envoyer le Message' },
  'contact.sending': { en: 'Sending...', fr: 'Envoi en cours...' },
  'contact.thankYou': { en: 'Thank you!', fr: 'Merci !' },
  'contact.received': { en: 'Your message has been received. We\'ll respond within 24 hours.', fr: 'Votre message a été reçu. Nous répondrons dans les 24 heures.' },
  'contact.sendAnother': { en: 'Send Another Message', fr: 'Envoyer un Autre Message' },
  'contact.visitUs': { en: 'Visit Us', fr: 'Rendez-nous Visite' },
  'contact.callUs': { en: 'Call Us', fr: 'Appelez-nous' },
  'contact.emailUs': { en: 'Email Us', fr: 'Écrivez-nous' },

  // ── Courses Page ──
  'courses.title': { en: 'Our Programs', fr: 'Nos Programmes' },
  'courses.subtitle': { en: 'Discover 9+ courses designed to launch your career in Goma and beyond.', fr: 'Découvrez plus de 9 cours conçus pour lancer votre carrière à Goma et au-delà.' },
  'courses.search': { en: 'Search courses...', fr: 'Rechercher des cours...' },
  'courses.allCourses': { en: 'All Courses', fr: 'Tous les Cours' },
  'courses.languages': { en: 'Languages', fr: 'Langues' },
  'courses.tradesIT': { en: 'Trades & IT', fr: 'Métiers et IT' },
  'courses.professional': { en: 'Professional', fr: 'Professionnel' },
  'courses.noCourses': { en: 'No courses found. Try a different search.', fr: 'Aucun cours trouvé. Essayez une autre recherche.' },
  'courses.notSure': { en: 'Not sure which course is right for you?', fr: 'Pas sûr de quel cours vous convient ?' },
  'courses.talkAdvisor': { en: 'Talk to our academic advisors. We\'ll help you find the perfect program.', fr: 'Parlez à nos conseillers académiques. Nous vous aiderons à trouver le programme parfait.' },
  'courses.contactAdvisor': { en: 'Contact an Advisor', fr: 'Contacter un Conseiller' },
  'courses.viewDetails': { en: 'View Full Details', fr: 'Voir les Détails' },
  'courses.close': { en: 'Close', fr: 'Fermer' },
  'courses.students': { en: 'students', fr: 'étudiants' },

  // ── About Page ──
  'aboutPage.title': { en: 'About BTC', fr: 'A propos de BTC' },
  'aboutPage.subtitle': { en: 'Learn about our mission, team, and the impact we\'re making in Goma, DRC.', fr: 'Découvrez notre mission, notre équipe et l\'impact que nous avons à Goma, RDC.' },
  'aboutPage.ourMission': { en: 'Our Mission', fr: 'Notre Mission' },
  'aboutPage.ourVision': { en: 'Our Vision', fr: 'Notre Vision' },
  'aboutPage.ourValues': { en: 'Our Values', fr: 'Nos Valeurs' },
  'aboutPage.ourTeam': { en: 'Our Team', fr: 'Notre Équipe' },
  'aboutPage.ourJourney': { en: 'Our Journey', fr: 'Notre Parcours' },

  // ── Login ──
  'login.welcomeBack': { en: 'Welcome back', fr: 'Bienvenue' },
  'login.signInSubtitle': { en: 'Sign in to access the management dashboard', fr: 'Connectez-vous pour accéder au tableau de bord' },
  'login.emailAddress': { en: 'Email Address', fr: 'Adresse Email' },
  'login.password': { en: 'Password', fr: 'Mot de Passe' },
  'login.enterPassword': { en: 'Enter your password', fr: 'Entrez votre mot de passe' },
  'login.rememberMe': { en: 'Remember me', fr: 'Se souvenir de moi' },
  'login.forgotPassword': { en: 'Forgot password?', fr: 'Mot de passe oublié ?' },
  'login.signIn': { en: 'Sign In', fr: 'Se Connecter' },
  'login.signingIn': { en: 'Signing in...', fr: 'Connexion en cours...' },
  'login.backToWebsite': { en: 'Back to Website', fr: 'Retour au Site' },
  'login.demo': { en: 'Demo: Enter any email and password to access the dashboard.', fr: 'Démo : Entrez n\'importe quel email et mot de passe pour accéder au tableau de bord.' },
  'login.error': { en: 'Please enter your email and password.', fr: 'Veuillez entrer votre email et mot de passe.' },

  // ── Dashboard ──
  'dash.goodMorning': { en: 'Good morning', fr: 'Bonjour' },
  'dash.whatsHappening': { en: 'Here\'s what\'s happening at BTC today.', fr: 'Voici ce qui se passe au BTC aujourd\'hui.' },
  'dash.totalStudents': { en: 'Total Students', fr: 'Total Étudiants' },
  'dash.activeCourses': { en: 'Active Courses', fr: 'Cours Actifs' },
  'dash.monthlyRevenue': { en: 'Monthly Revenue', fr: 'Revenu Mensuel' },
  'dash.staffMembers': { en: 'Staff Members', fr: 'Membres du Personnel' },
  'dash.revenueExpenses': { en: 'Revenue vs Expenses', fr: 'Revenus vs Dépenses' },
  'dash.last8Months': { en: 'Last 8 months', fr: 'Derniers 8 mois' },
  'dash.studentsByProgram': { en: 'Students by Program', fr: 'Étudiants par Programme' },
  'dash.distribution': { en: 'Distribution', fr: 'Répartition' },
  'dash.newEnrollments': { en: 'New Enrollments', fr: 'Nouvelles Inscriptions' },
  'dash.monthly': { en: 'Monthly', fr: 'Mensuel' },
  'dash.recentEnrollments': { en: 'Recent Enrollments', fr: 'Inscriptions Récentes' },
  'dash.viewAll': { en: 'View All', fr: 'Voir Tout' },
  'dash.quickActions': { en: 'Quick Actions', fr: 'Actions Rapides' },
  'dash.addStudent': { en: 'Add Student', fr: 'Ajouter Étudiant' },
  'dash.addStaff': { en: 'Add Staff', fr: 'Ajouter Personnel' },
  'dash.newCourse': { en: 'New Course', fr: 'Nouveau Cours' },
  'dash.viewFinance': { en: 'View Finance', fr: 'Voir Finances' },
  'dash.viewEnrollments': { en: 'Enrollments', fr: 'Inscriptions' },
  'dash.revenue': { en: 'Revenue', fr: 'Revenus' },
  'dash.expenses': { en: 'Expenses', fr: 'Dépenses' },

  // ── Portal Dashboard ──
  'portalDash.welcomeBack': { en: 'Welcome back', fr: 'Bon retour' },
  'portalDash.continueLearning': { en: 'Let\'s continue your learning journey.', fr: 'Continuons votre parcours d\'apprentissage.' },
  'portalDash.dayStreak': { en: 'day streak!', fr: 'jours consécutifs !' },
  'portalDash.enrolledCourses': { en: 'Enrolled Courses', fr: 'Cours Inscrits' },
  'portalDash.hoursThisWeek': { en: 'Hours This Week', fr: 'Heures Cette Semaine' },
  'portalDash.certificates': { en: 'Certificates', fr: 'Certificats' },
  'portalDash.avgScore': { en: 'Avg. Score', fr: 'Score Moyen' },
  'portalDash.continueLearningTitle': { en: 'Continue Learning', fr: 'Continuer l\'Apprentissage' },
  'portalDash.viewAll': { en: 'View All', fr: 'Voir Tout' },
  'portalDash.studyHours': { en: 'Study Hours', fr: 'Heures d\'Étude' },
  'portalDash.thisWeek': { en: 'This week', fr: 'Cette semaine' },
  'portalDash.total': { en: 'Total', fr: 'Total' },
  'portalDash.todaySchedule': { en: 'Today\'s Schedule', fr: 'Emploi du Temps du Jour' },
  'portalDash.notifications': { en: 'Notifications', fr: 'Notifications' },
  'portalDash.continue': { en: 'Continue', fr: 'Continuer' },
  'portalDash.inPerson': { en: 'In-Person', fr: 'En Personne' },
  'portalDash.virtual': { en: 'Virtual', fr: 'Virtuel' },
  'progress.payment': { en: 'Payment', fr: 'Paiement' },
  'progress.learning': { en: 'Learning', fr: 'Apprentissage' },
  'progress.exercises': { en: 'Exercises & Tasks', fr: 'Exercices & Tâches' },
  'progress.assessment': { en: 'Assessment', fr: 'Évaluation' },
  'progress.assignment': { en: 'Assignment', fr: 'Devoir' },
  'progress.paidOf': { en: 'paid of', fr: 'payé sur' },
  'progress.notStarted': { en: 'Not started', fr: 'Non commencé' },
  'progress.submitted': { en: 'Submitted', fr: 'Soumis' },
  'progress.graded': { en: 'Graded', fr: 'Noté' },
  'progress.inProgress': { en: 'In progress', fr: 'En cours' },
  'progress.myProgress': { en: 'My Progress', fr: 'Mon Progrès' },
  'progress.noEnrollments': { en: 'No enrollments yet.', fr: 'Aucune inscription.' },
  'progress.browsePrograms': { en: 'Browse Programs', fr: 'Explorer les Programmes' },

  // ── Common ──
  'common.search': { en: 'Search', fr: 'Rechercher' },
  'common.save': { en: 'Save', fr: 'Enregistrer' },
  'common.cancel': { en: 'Cancel', fr: 'Annuler' },
  'common.delete': { en: 'Delete', fr: 'Supprimer' },
  'common.edit': { en: 'Edit', fr: 'Modifier' },
  'common.add': { en: 'Add', fr: 'Ajouter' },
  'common.export': { en: 'Export', fr: 'Exporter' },
  'common.close': { en: 'Close', fr: 'Fermer' },
  'common.back': { en: 'Back', fr: 'Retour' },
  'common.next': { en: 'Next', fr: 'Suivant' },
  'common.previous': { en: 'Previous', fr: 'Précédent' },
  'common.students': { en: 'Students', fr: 'Étudiants' },
  'common.staff': { en: 'Staff', fr: 'Personnel' },
  'common.staffSchedules': { en: 'Staff schedules', fr: 'Plannings staff' },
  'common.lecturerAttendance': { en: 'Lecturer attendance', fr: 'Présences enseignants' },
  'common.lecturerRates': { en: 'Lecturer rates', fr: 'Taux enseignants' },
  'common.wallet': { en: 'Wallet', fr: 'Portefeuille' },
  'common.attendanceRequests': { en: 'Attendance requests', fr: 'Demandes de présence' },
  'common.financing': { en: 'Financing', fr: 'Finances' },
  'common.onlineStudies': { en: 'Online Studies', fr: 'Études en Ligne' },
  'common.settings': { en: 'Settings', fr: 'Paramètres' },
  'common.overview': { en: 'Overview', fr: 'Aperçu' },
  'common.myCourses': { en: 'My Courses', fr: 'Mes Cours' },
  'common.certificates': { en: 'Certificates', fr: 'Certificats' },
  'common.jobBoard': { en: 'Job Board', fr: 'Offres d\'Emploi' },
  'common.aiAssistant': { en: 'AI Assistant', fr: 'Assistant IA' },
  'common.calendar': { en: 'Calendar', fr: 'Calendrier' },
  'common.community': { en: 'Community', fr: 'Communauté' },
  'common.logout': { en: 'Logout', fr: 'Déconnexion' },
  'common.backToWebsite': { en: 'Back to Website', fr: 'Retour au Site' },
  'common.website': { en: 'Website', fr: 'Site Web' },
  'common.adminPanel': { en: 'Admin Panel', fr: 'Panneau Admin' },
  'common.studentDashboard': { en: 'Student Dashboard', fr: 'Tableau de Bord Étudiant' },
  'common.myDashboard': { en: 'My Dashboard', fr: 'Mon Tableau de Bord' },
  'common.instructor': { en: 'Staff', fr: 'Personnel' },
  'common.duration': { en: 'Duration', fr: 'Durée' },
  'common.level': { en: 'Level', fr: 'Niveau' },
  'common.price': { en: 'Price', fr: 'Prix' },
  'common.rating': { en: 'Rating', fr: 'Note' },
  'common.status': { en: 'Status', fr: 'Statut' },
  'common.active': { en: 'Active', fr: 'Actif' },
  'common.inactive': { en: 'Inactive', fr: 'Inactif' },
  'common.paid': { en: 'Paid', fr: 'Payé' },
  'common.pending': { en: 'Pending', fr: 'En Attente' },
  'common.completed': { en: 'Completed', fr: 'Complété' },
  'common.hours': { en: 'hours', fr: 'heures' },

  // ── Notifications ──
  'notif.title': { en: 'Notifications', fr: 'Notifications' },
  'notif.markAllRead': { en: 'Mark all read', fr: 'Tout marquer comme lu' },
  'notif.noNotifications': { en: 'No notifications', fr: 'Aucune notification' },
  'notif.viewAll': { en: 'View All Notifications', fr: 'Voir Toutes les Notifications' },

  // ── Registration ──
  'reg.title': { en: 'Student Registration', fr: 'Inscription Étudiant' },
  'reg.subtitle': { en: 'Join BTC and start your journey to success', fr: 'Rejoignez BTC et commencez votre parcours vers le succès' },
  'reg.step1': { en: 'Personal Info', fr: 'Infos Personnelles' },
  'reg.step2': { en: 'Training Selection', fr: 'Choix de Formation' },
  'reg.step3': { en: 'Schedule', fr: 'Horaire' },
  'reg.step4': { en: 'Confirmation', fr: 'Confirmation' },
  'reg.fullName': { en: 'Full Name', fr: 'Nom Complet' },
  'reg.phone': { en: 'Phone Number', fr: 'Numéro de Téléphone' },
  'reg.gender': { en: 'Gender', fr: 'Genre' },
  'reg.male': { en: 'Male', fr: 'Masculin' },
  'reg.female': { en: 'Female', fr: 'Féminin' },
  'reg.address': { en: 'Address', fr: 'Adresse' },
  'reg.dob': { en: 'Date of Birth', fr: 'Date de Naissance' },
  'reg.referral': { en: 'How did you hear about BTC?', fr: 'Comment avez-vous entendu parler de BTC ?' },
  'reg.department': { en: 'Department', fr: 'Département' },
  'reg.selectDept': { en: 'Select a department', fr: 'Sélectionnez un département' },
  'reg.course': { en: 'Course', fr: 'Cours' },
  'reg.selectCourse': { en: 'Select a course', fr: 'Sélectionnez un cours' },
  'reg.schedule': { en: 'Preferred Time Slot', fr: 'Créneau Horaire Préféré' },
  'reg.submit': { en: 'Complete Registration', fr: 'Finaliser l\'Inscription' },
  'reg.success': { en: 'Registration Successful!', fr: 'Inscription Réussie !' },
  'reg.successMsg': { en: 'Your registration has been submitted. Please proceed to payment.', fr: 'Votre inscription a été soumise. Veuillez procéder au paiement.' },
  'reg.goToPayment': { en: 'Proceed to Payment', fr: 'Procéder au Paiement' },
  'reg.alreadyStudent': { en: 'Already a student?', fr: 'Déjà étudiant ?' },
  'reg.loginHere': { en: 'Login here', fr: 'Connectez-vous ici' },
  'reg.email': { en: 'Email Address', fr: 'Adresse Email' },
  'reg.password': { en: 'Password (min. 6 characters)', fr: 'Mot de passe (min. 6 caractères)' },
  'reg.passwordHint': { en: 'Minimum 6 characters', fr: 'Minimum 6 caractères' },

  // ── Departments ──
  'dept.english': { en: 'English', fr: 'Anglais' },
  'dept.computerScience': { en: 'Computer Science', fr: 'Informatique' },
  'dept.driving': { en: 'Driving', fr: 'Conduite' },
  'dept.sewing': { en: 'Sewing', fr: 'Couture' },
  'dept.title': { en: 'Departments', fr: 'Départements' },
  'dept.manage': { en: 'Manage departments and courses', fr: 'Gérer les départements et cours' },

  // ─��� Payments ──
  'pay.title': { en: 'Payments', fr: 'Paiements' },
  'pay.subtitle': { en: 'Manage your tuition and payment history', fr: 'Gérez vos frais de scolarité et historique de paiements' },
  'pay.currentBalance': { en: 'Current Balance', fr: 'Solde Actuel' },
  'pay.totalPaid': { en: 'Total Paid', fr: 'Total Payé' },
  'pay.nextDue': { en: 'Next Due Date', fr: 'Prochaine Échéance' },
  'pay.makePayment': { en: 'Make Payment', fr: 'Effectuer un Paiement' },
  'pay.history': { en: 'Payment History', fr: 'Historique des Paiements' },
  'pay.receipt': { en: 'Receipt', fr: 'Reçu' },
  'pay.amount': { en: 'Amount', fr: 'Montant' },
  'pay.date': { en: 'Date', fr: 'Date' },
  'pay.method': { en: 'Method', fr: 'Méthode' },
  'pay.downloadReceipt': { en: 'Download Receipt', fr: 'Télécharger le Reçu' },

  // ── Student ID ──
  'sid.title': { en: 'Student ID Card', fr: 'Carte d\'Étudiant' },
  'sid.subtitle': { en: 'Your digital student card and boarding pass', fr: 'Votre carte d\'étudiant numérique et pass d\'embarquement' },
  'sid.studentId': { en: 'Student ID', fr: 'ID Étudiant' },
  'sid.rollNumber': { en: 'Roll No.', fr: 'Matricule' },
  'sid.department': { en: 'Department', fr: 'Département' },
  'sid.enrolled': { en: 'Enrolled', fr: 'Inscrit' },
  'sid.validUntil': { en: 'Valid Until', fr: 'Valide Jusqu\'à' },
  'sid.schedule': { en: 'Class Schedule', fr: 'Emploi du Temps' },
  'sid.instructor': { en: 'Staff', fr: 'Personnel' },
  'sid.scanQR': { en: 'Scan for attendance', fr: 'Scanner pour la présence' },
  'sid.download': { en: 'Download Card', fr: 'Télécharger la Carte' },

  // ── Attendance ──
  'att.title': { en: 'Attendance', fr: 'Présences' },
  'att.subtitle': { en: 'Track your class attendance', fr: 'Suivez votre assiduité' },
  'att.present': { en: 'Present', fr: 'Présent' },
  'att.absent': { en: 'Absent', fr: 'Absent' },
  'att.late': { en: 'Late', fr: 'En retard' },
  'att.rate': { en: 'Attendance Rate', fr: 'Taux de Présence' },
  'att.totalClasses': { en: 'Total Classes', fr: 'Total des Cours' },
  'att.markAttendance': { en: 'Mark Attendance', fr: 'Marquer la Présence' },
  'att.scanQR': { en: 'Scan QR Code', fr: 'Scanner le Code QR' },

  // ── Instructor ──
  'inst.title': { en: 'Staff Dashboard', fr: 'Tableau de Bord Personnel' },
  'inst.myClasses': { en: 'My Classes', fr: 'Mes Cours' },
  'inst.attendance': { en: 'Attendance', fr: 'Présences' },
  'inst.materials': { en: 'Materials', fr: 'Matériels' },
  'inst.schedule': { en: 'Schedule', fr: 'Emploi du Temps' },
  'inst.viewStudents': { en: 'View Students', fr: 'Voir les Étudiants' },
  'inst.uploadMaterial': { en: 'Upload Material', fr: 'Téléverser du Matériel' },
  'inst.todayClasses': { en: 'Today\'s Classes', fr: 'Cours du Jour' },
  'inst.totalStudents': { en: 'Total Students', fr: 'Total Étudiants' },
  'inst.classesThisWeek': { en: 'Classes This Week', fr: 'Cours Cette Semaine' },
  'inst.avgAttendance': { en: 'Avg. Attendance', fr: 'Présence Moyenne' },
  'inst.panel': { en: 'Staff Panel', fr: 'Panneau Personnel' },

  // ── Reports ──
  'reports.title': { en: 'Reports & Analytics', fr: 'Rapports et Analyses' },
  'reports.subtitle': { en: 'Comprehensive data insights for BTC', fr: 'Analyses complètes des données pour BTC' },
  'reports.enrollment': { en: 'Enrollment Report', fr: 'Rapport d\'Inscriptions' },
  'reports.revenue': { en: 'Revenue Report', fr: 'Rapport de Revenus' },
  'reports.attendance': { en: 'Attendance Report', fr: 'Rapport de Présences' },
  'reports.performance': { en: 'Performance Report', fr: 'Rapport de Performance' },

  // ── Admin extras ──
  'common.departments': { en: 'Departments', fr: 'Départements' },
  'common.reports': { en: 'Reports', fr: 'Rapports' },
  'common.certificatesAdmin': { en: 'Certificates', fr: 'Certificats' },
  'common.attendanceAdmin': { en: 'Attendance', fr: 'Présences' },
  'common.payments': { en: 'Payments', fr: 'Paiements' },
  'common.studentID': { en: 'Student ID', fr: 'Carte Étudiant' },
  'common.myAttendance': { en: 'My Attendance', fr: 'Mes Présences' },
  'common.myPayments': { en: 'My Payments', fr: 'Mes Paiements' },
  'common.register': { en: 'Register', fr: 'S\'inscrire' },
  'common.people': { en: 'People', fr: 'Personnel & Étudiants' },
  'common.academic': { en: 'Academic', fr: 'Académique' },
  'common.finance': { en: 'Finance', fr: 'Finances' },
  'common.reportsAndCertificates': { en: 'Reports & Certificates', fr: 'Rapports & Certificats' },
  'common.programsAndFees': { en: 'Programs & Fees', fr: 'Programmes & Frais' },
  'common.program': { en: 'Program', fr: 'Programme' },
  'common.fees': { en: 'Fees', fr: 'Frais' },
  'common.promotionsAndEnrollments': { en: 'Promotions & Enrollments', fr: 'Promotions & Inscriptions' },
  'common.promotions': { en: 'Promotions', fr: 'Promotions' },
  'common.classes': { en: 'Classes', fr: 'Classes' },
  'common.feeStructures': { en: 'Fee Structures', fr: 'Structure des Frais' },
  'common.enrollments': { en: 'Enrollments', fr: 'Inscriptions' },
  'common.exchangeRates': { en: 'Exchange Rates', fr: 'Taux de change' },
  'common.myRecords': { en: 'My Records', fr: 'Mes Dossiers' },
  'common.connect': { en: 'Connect', fr: 'Connecter' },
  'common.lessons': { en: 'Lessons', fr: 'Leçons' },
  'common.learning': { en: 'Exercises & Assessments', fr: 'Exercices & Évaluations' },
  'learning.exercises': { en: 'Exercises', fr: 'Exercices' },
  'learning.assessments': { en: 'Assessments / Quizzes', fr: 'Évaluations / Quiz' },
  'learning.assignments': { en: 'Assignments', fr: 'Devoirs' },
  'learning.submissions': { en: 'Submissions to grade', fr: 'Soumissions à noter' },
  'learning.addActivity': { en: 'Add activity', fr: 'Ajouter une activité' },
  'learning.requiresSubmission': { en: 'Requires submission (staff corrects)', fr: 'Soumission requise (correction par le personnel)' },
  'learning.assignToPromotions': { en: 'Assign to promotions', fr: 'Assigner aux promotions' },
  'learning.assignToClasses': { en: 'Assign to classes', fr: 'Assigner aux classes' },
  'learning.manageItems': { en: 'Manage items', fr: 'Gérer les questions' },
  'learning.itemTypes.multiple_choice': { en: 'Multiple choice', fr: 'Choix multiples' },
  'learning.itemTypes.theoretical': { en: 'Theoretical / Essay', fr: 'Théorique / Dissertation' },
  'learning.itemTypes.video': { en: 'Video', fr: 'Vidéo' },
  'learning.itemTypes.audio': { en: 'Audio', fr: 'Audio' },
  'learning.itemTypes.listening': { en: 'Listening', fr: 'Compréhension orale' },
  'learning.itemTypes.reading': { en: 'Reading', fr: 'Lecture' },
  'learning.itemTypes.true_false': { en: 'True / False', fr: 'Vrai / Faux' },
  'learning.itemTypes.matching': { en: 'Matching', fr: 'Appariement' },
  'learning.itemTypes.fill_blank': { en: 'Fill in the blank', fr: 'Texte à trous' },
  'learning.grade': { en: 'Grade', fr: 'Noter' },
  'learning.submitted': { en: 'Submitted', fr: 'Soumis' },
  'learning.graded': { en: 'Graded', fr: 'Noté' },
  'learning.draft': { en: 'Draft', fr: 'Brouillon' },

  // ── Staff ──
  'staff.title': { en: 'Staff Dashboard', fr: 'Tableau de Bord Personnel' },
  'staff.myClasses': { en: 'My Classes', fr: 'Mes Cours' },
  'staff.attendance': { en: 'Attendance', fr: 'Présences' },
  'staff.materials': { en: 'Materials', fr: 'Matériels' },
  'staff.schedule': { en: 'Schedule', fr: 'Emploi du Temps' },
  'staff.viewStudents': { en: 'View Students', fr: 'Voir les Étudiants' },
  'staff.uploadMaterial': { en: 'Upload Material', fr: 'Téléverser du Matériel' },
  'staff.todayClasses': { en: 'Today\'s Classes', fr: 'Cours du Jour' },
  'staff.totalStudents': { en: 'Total Students', fr: 'Total Étudiants' },
  'staff.classesThisWeek': { en: 'Classes This Week', fr: 'Cours Cette Semaine' },
  'staff.avgAttendance': { en: 'Avg. Attendance', fr: 'Présence Moyenne' },
  'staff.panel': { en: 'Staff Panel', fr: 'Panneau Personnel' },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('btc_lang') as Lang) || 'fr';
  });

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('btc_lang', newLang);
  }, []);

  const t = useCallback((key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] || entry.en || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}