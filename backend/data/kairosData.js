/**
 * Kairos Lite Knowledge Base & Configuration
 * Free assistance for Jobs, Internships, and Courses.
 */

const KAIROS_CONFIG = {
  name: "Kairos Lite",
  tagline: "I help you find a job, an internship or a course, for free.",
  freeService: true,
  
  // Screen 0: Initial Language Selection Sequence
  languageSelection: {
    welcomeMessage: "Welcome to Kairos\nBienvenue sur Kairos",
    prompt: "Pick your language\nChoisissez votre langue",
    buttons: [
      { id: "lang_en", title: "English" },
      { id: "lang_fr", title: "Français" }
    ]
  },

  // French Flow (Screen 1 & Video Flow)
  frenchFlow: {
    welcomeMessage: "Bienvenue sur Kairos – Votre professeur préféré.",
    posterImage: "programme_poster.jpg",
    consentQuestion: "Suivez gratuitement le cours d'introduction et lancez votre parcours vers la réussite en affaires.",
    consentButtons: [
      { id: "agree", title: "J'accepte" }
    ],
    moreInfoText: "Kairos Lite vous aide à trouver un emploi, un stage ou une formation, 100% gratuitement.\n\nNous vous posons quelques questions simples afin de vous proposer des offres adaptées à votre profil. Vos données restent strictement confidentielles.",
    demoVideo: {
      filename: "french.mp4",
      caption: "Commencer gratuitement",
      subscriptionQuestion: "Souhaitez-vous vous inscrire à notre cours ?",
      buttons: [
        { id: "sub_accept", title: "J'accepte" }
      ],
      registrationLink: "https://reg-feandsme-sprout.web.app/registration",
      registrationPrompt: "Super ! Veuillez remplir le formulaire d'inscription pour vous inscrire à notre cours :\n\n👉 https://reg-feandsme-sprout.web.app/registration\n\nUne fois soumis, revenez ici et appuyez ci-dessous !",
      registrationButtons: [
        { id: "form_submitted", title: "Soumis ✅" }
      ],
      thankYouMessage: "Merci, nous vous contacterons sous peu.",
      declineMessage: "Merci pour votre temps ! Si vous changez d'avis, écrivez *Bonjour* à tout moment pour voir la vidéo ou vous inscrire."
    }
  },

  // English Flow (Screen 1 & Video Flow)
  englishFlow: {
    welcomeMessage: "Welcome to Kairos – Your favorite teacher.",
    posterImage: "programme_poster_english.jpg",
    consentQuestion: "Take the introductory course for free and start your journey to business success.",
    consentButtons: [
      { id: "agree", title: "I accept" }
    ],
    moreInfoText: "Kairos Lite helps you access skills, training and business growth tools, 100% free.\n\nYour data remains strictly confidential.",
    demoVideo: {
      filename: "kairos_english.mp4",
      caption: "Start for free",
      subscriptionQuestion: "Would you like to register for our course?",
      buttons: [
        { id: "sub_accept", title: "I accept" }
      ],
      registrationLink: "https://reg-fe-and-sme-sprout.web.app",
      registrationPrompt: "Great! Please fill out the registration form to enroll in our course:\n\n👉 https://reg-fe-and-sme-sprout.web.app\n\nOnce submitted, return here and tap below!",
      registrationButtons: [
        { id: "form_submitted", title: "Submitted ✅" }
      ],
      thankYouMessage: "Thank you, we will contact you shortly.",
      declineMessage: "Thank you for your time! If you change your mind, type *Hi* at any time to watch the video or register."
    }
  },

  // Backward-compatibility defaults (French)
  welcomeMessage: "Bienvenue sur Kairos – Votre professeur préféré.",
  posterImage: "programme_poster.jpg",
  consentQuestion: "Suivez gratuitement le cours d'introduction et lancez votre parcours vers la réussite en affaires.",
  consentButtons: [
    { id: "agree", title: "J'accepte" }
  ],
  moreInfoText: "Kairos Lite vous aide à trouver un emploi, un stage ou une formation, 100% gratuitement.\n\nNous vous posons quelques questions simples afin de vous proposer des offres adaptées à votre profil. Vos données restent strictement confidentielles.",
  demoVideo: {
    filename: "french.mp4",
    caption: "Commencer gratuitement",
    subscriptionQuestion: "Souhaitez-vous vous inscrire à notre cours ?",
    buttons: [
      { id: "sub_accept", title: "J'accepte" }
    ],
    registrationLink: "https://reg-feandsme-sprout.web.app/registration",
    registrationPrompt: "Super ! Veuillez remplir le formulaire d'inscription pour vous inscrire à notre cours :\n\n👉 https://reg-feandsme-sprout.web.app/registration\n\nUne fois soumis, revenez ici et appuyez ci-dessous !",
    registrationButtons: [
      { id: "form_submitted", title: "Soumis ✅" }
    ],
    thankYouMessage: "Merci, nous vous contacterons sous peu.",
    declineMessage: "Merci pour votre temps ! Si vous changez d'avis, écrivez *Bonjour* à tout moment pour voir la vidéo ou vous inscrire."
  },

  // Screen 2: Looking For
  lookingForQuestion: "Thank you! What are you looking for today?",
  lookingForButtons: [
    { id: "opt_job", title: "A job" },
    { id: "opt_internship", title: "An internship" },
    { id: "opt_course", title: "A course" }
  ],

  // Screen 3: User Profile Buttons
  profileQuestion: "You are:",
  profileButtonsPart1: [
    { id: "profile_student", title: "A student" },
    { id: "profile_housewife", title: "A housewife" },
    { id: "profile_young_woman", title: "A young woman" }
  ],
  profileButtonsPart2: [
    { id: "profile_professional", title: "Working professional" },
    { id: "profile_job_seeker", title: "A job seeker" }
  ],

  // Screen 4: 4 Quick Questions
  questionsIntro: "Thanks! 4 quick questions to find what suits you.",
  questions: [
    {
      step: "Q1",
      number: "Question 1/4",
      prompt: "*Question 1/4*\nHow many hours a day are you available?",
      buttons: [
        { id: "hours_2_3", title: "2 to 3 hours" },
        { id: "hours_4_6", title: "4 to 6 hours" },
        { id: "hours_full", title: "Full time" }
      ]
    },
    {
      step: "Q2",
      number: "Question 2/4",
      prompt: "*Question 2/4*\nWhere do you prefer to work?",
      buttons: [
        { id: "loc_home", title: "From home" },
        { id: "loc_nearby", title: "Nearby" },
        { id: "loc_flexible", title: "Flexible / Any" }
      ]
    },
    {
      step: "Q3",
      number: "Question 3/4",
      prompt: "*Question 3/4*\nWhat device do you have available?",
      buttons: [
        { id: "dev_smart", title: "Smartphone" },
        { id: "dev_pc", title: "Computer / Laptop" },
        { id: "dev_both", title: "Both" }
      ]
    },
    {
      step: "Q4",
      number: "Question 4/4",
      prompt: "*Question 4/4*\nWhen can you start?",
      buttons: [
        { id: "start_now", title: "Immediately" },
        { id: "start_week", title: "Within a week" },
        { id: "start_month", title: "In a month" }
      ]
    }
  ],

  // Screen 5: Offers List
  offersIntro: "Here are 3 offers for you, with work from home possible:",
  offersListBody: "*1. Online seller*\nFrom home · Half-time\n\n*2. Data entry assistant*\nCocody · Part-time\n\n*3. Mobile Money agent*\nYopougon · Verified employer",
  offersButtons: [
    { id: "details_offer_1", title: "Details of offer 1" },
    { id: "see_more_offers", title: "See more offers" }
  ],

  // Screen 6: Offer Details & Apply
  offerDetails: {
    id: "offer_1",
    title: "*Online seller*",
    meta: "From home · Half-time\nVerified employer",
    applyPrompt: "Apply with your Kairos profile?\nYour CV is ready.",
    buttons: [
      { id: "apply_offer", title: "Apply" },
      { id: "edit_cv", title: "Edit my CV" },
      { id: "ask_kairos_ai", title: "🤖 Ask Kairos AI" }
    ]
  },

  offerDetailsMobileMoney: {
    id: "offer_3",
    title: "*Mobile Money agent*",
    meta: "Yopougon · Full time\nEmployeur vérifié",
    applyPrompt: "Apply with your Kairos profile?\nYour CV is ready.",
    buttons: [
      { id: "apply_offer", title: "Apply" },
      { id: "edit_cv", title: "Edit my CV" },
      { id: "ask_kairos_ai", title: "🤖 Ask Kairos AI" }
    ]
  },

  // More offers (Screen 5 expansion)
  moreOffersList: "*4. Customer Support Agent*\nRemote · Full time\n\n*5. Delivery Partner*\nLocal area · Flexible hours\n\n*6. Digital Marketing Assistant*\nFrom home · Part-time",
  moreOffersButtons: [
    { id: "details_offer_3", title: "Details of offer 3" },
    { id: "details_offer_1", title: "Details of offer 1" }
  ],

  // Confirmation
  applicationSuccessMessage: "Application sent. Type TRACK to see your applications.",

  // Screen Course Flow (Screens 1, 2, 3)
  courseFlow: {
    // Screen 1: Field Selection
    fieldQuestion: "Which field interests you?",
    fieldsList: [
      { id: "field_business", title: "Business & sales", description: "Selling, shop management, retail" },
      { id: "field_sewing", title: "Sewing and fashion", description: "Tailoring, styling, design" },
      { id: "field_digital", title: "Digital skills", description: "Social media, Excel, computers" },
      { id: "field_food", title: "Food and catering", description: "Cooking, snacks, food business" },
      { id: "field_small_biz", title: "Small business mgmt", description: "Bookkeeping, customer care" }
    ],
    fieldButtonsPart1: [
      { id: "field_business", title: "Business and sales" },
      { id: "field_sewing", title: "Sewing and fashion" },
      { id: "field_digital", title: "Digital skills" }
    ],
    fieldButtonsPart2: [
      { id: "field_food", title: "Food and catering" },
      { id: "field_small_biz", title: "Small business mgmt" }
    ],

    // Screen 2: Courses List
    coursesIntro: "Courses for you, right here on WhatsApp:\n\n*1. Selling online*\n2 weeks · Free\n\n*2. Running a small shop*\n3 weeks · Free\n\n*3. Basic Excel*\n4 weeks · Paid",
    courseButtons: [
      { id: "choose_1", title: "Choose 1" },
      { id: "choose_2", title: "Choose 2" },
      { id: "choose_3", title: "Choose 3" }
    ],

    // Screen 3: Lessons & Video Clips
    courseCatalog: {
      choose_1: {
        name: "Selling online",
        intro: "You chose: Selling online. One lesson a day at 6 pm, in 4 short clips.",
        clips: [
          {
            clipNumber: 1,
            label: "Lesson 1 · Clip 1/4: your catalogue",
            duration: "1:20 · 4 MB",
            url: "https://kairos-lite.org/lessons/selling-online-clip1.mp4",
            audioUrl: "https://kairos-lite.org/lessons/selling-online-audio1.mp3"
          },
          {
            clipNumber: 2,
            label: "Lesson 1 · Clip 2/4: Customer conversations",
            duration: "1:15 · 3.8 MB",
            url: "https://kairos-lite.org/lessons/selling-online-clip2.mp4",
            audioUrl: "https://kairos-lite.org/lessons/selling-online-audio2.mp3"
          },
          {
            clipNumber: 3,
            label: "Lesson 1 · Clip 3/4: Setting your prices",
            duration: "1:30 · 4.2 MB",
            url: "https://kairos-lite.org/lessons/selling-online-clip3.mp4",
            audioUrl: "https://kairos-lite.org/lessons/selling-online-audio3.mp3"
          },
          {
            clipNumber: 4,
            label: "Lesson 1 · Clip 4/4: Payments & delivery",
            duration: "1:10 · 3.5 MB",
            url: "https://kairos-lite.org/lessons/selling-online-clip4.mp4",
            audioUrl: "https://kairos-lite.org/lessons/selling-online-audio4.mp3"
          }
        ]
      },
      choose_2: {
        name: "Running a small shop",
        intro: "You chose: Running a small shop. One lesson a day at 6 pm, in 4 short clips.",
        clips: [
          {
            clipNumber: 1,
            label: "Lesson 1 · Clip 1/4: Choosing fast-moving stock",
            duration: "1:25 · 4.1 MB",
            url: "https://kairos-lite.org/lessons/small-shop-clip1.mp4",
            audioUrl: "https://kairos-lite.org/lessons/small-shop-audio1.mp3"
          },
          {
            clipNumber: 2,
            label: "Lesson 1 · Clip 2/4: Managing profit margins",
            duration: "1:20 · 3.9 MB",
            url: "https://kairos-lite.org/lessons/small-shop-clip2.mp4",
            audioUrl: "https://kairos-lite.org/lessons/small-shop-audio2.mp3"
          },
          {
            clipNumber: 3,
            label: "Lesson 1 · Clip 3/4: Attracting repeat customers",
            duration: "1:15 · 3.7 MB",
            url: "https://kairos-lite.org/lessons/small-shop-clip3.mp4",
            audioUrl: "https://kairos-lite.org/lessons/small-shop-audio3.mp3"
          },
          {
            clipNumber: 4,
            label: "Lesson 1 · Clip 4/4: Simple daily bookkeeping",
            duration: "1:30 · 4.3 MB",
            url: "https://kairos-lite.org/lessons/small-shop-clip4.mp4",
            audioUrl: "https://kairos-lite.org/lessons/small-shop-audio4.mp3"
          }
        ]
      },
      choose_3: {
        name: "Basic Excel",
        intro: "You chose: Basic Excel. One lesson a day at 6 pm, in 4 short clips.",
        clips: [
          {
            clipNumber: 1,
            label: "Lesson 1 · Clip 1/4: Spreadsheet interface & rows",
            duration: "1:15 · 3.9 MB",
            url: "https://kairos-lite.org/lessons/excel-clip1.mp4",
            audioUrl: "https://kairos-lite.org/lessons/excel-audio1.mp3"
          },
          {
            clipNumber: 2,
            label: "Lesson 1 · Clip 2/4: Entering tables and numbers",
            duration: "1:20 · 4.0 MB",
            url: "https://kairos-lite.org/lessons/excel-clip2.mp4",
            audioUrl: "https://kairos-lite.org/lessons/excel-audio2.mp3"
          },
          {
            clipNumber: 3,
            label: "Lesson 1 · Clip 3/4: Automatic calculations with SUM",
            duration: "1:35 · 4.4 MB",
            url: "https://kairos-lite.org/lessons/excel-clip3.mp4",
            audioUrl: "https://kairos-lite.org/lessons/excel-audio3.mp3"
          },
          {
            clipNumber: 4,
            label: "Lesson 1 · Clip 4/4: Formatting and saving sheets",
            duration: "1:10 · 3.6 MB",
            url: "https://kairos-lite.org/lessons/excel-clip4.mp4",
            audioUrl: "https://kairos-lite.org/lessons/excel-audio4.mp3"
          }
        ]
      }
    }
  }
};

const JOB_CATALOG = [
  {
    id: "offer_1",
    title: "Online seller",
    location: "From home",
    hours: "Half-time / 2 to 3 hours",
    device: "Smartphone",
    verified: true,
    description: "Sell products online via WhatsApp and social channels. No prior sales experience needed; free training provided."
  },
  {
    id: "offer_2",
    title: "Data entry assistant",
    location: "Cocody / Remote",
    hours: "Part-time (4 to 6 hours)",
    device: "Computer / Laptop",
    verified: true,
    description: "Enter customer data and order details into online spreadsheets. Basic computer familiarity required."
  },
  {
    id: "offer_3",
    title: "Mobile Money agent",
    location: "Yopougon / Local area",
    hours: "Full time / Flexible",
    device: "Smartphone",
    verified: true,
    description: "Assist local customers with cash-in, cash-out and basic account services for verified financial partner."
  },
  {
    id: "offer_4",
    title: "Customer Support Agent",
    location: "Remote / From home",
    hours: "Full time or Flexible shifts",
    device: "Smartphone or Laptop",
    verified: true,
    description: "Handle incoming customer inquiries and basic questions via WhatsApp chat. Free training provided."
  },
  {
    id: "offer_5",
    title: "Delivery Partner",
    location: "Local area",
    hours: "Flexible hours",
    device: "Smartphone",
    verified: true,
    description: "Pick up and deliver local packages in your neighborhood on your own schedule."
  },
  {
    id: "offer_6",
    title: "Digital Marketing Assistant",
    location: "From home",
    hours: "Part-time (2 to 4 hours)",
    device: "Smartphone or Laptop",
    verified: true,
    description: "Post promotions, create simple Canva banners, and engage with online audience."
  }
];

module.exports = {
  KAIROS_CONFIG,
  JOB_CATALOG
};
