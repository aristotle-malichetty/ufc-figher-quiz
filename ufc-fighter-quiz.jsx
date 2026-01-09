import React, { useState, useEffect, useRef } from 'react';

// Cloudflare Worker proxy (API key hidden securely)
const API_BASE = 'https://ufc-quiz-proxy.aristotle.me';

// Quiz questions that map to fighter attributes
const QUESTIONS = [
  {
    id: 'approach',
    question: "You're in a street fight. What's your move?",
    options: [
      { text: "Stand and bang 👊", value: { striking: 3, grappling: 0, aggression: 3 } },
      { text: "Take them down immediately 🤼", value: { striking: 0, grappling: 3, aggression: 2 } },
      { text: "Feel them out, pick my shots 🎯", value: { striking: 2, grappling: 1, aggression: 0 } },
      { text: "Clinch and control 🔒", value: { striking: 1, grappling: 2, aggression: 1 } },
    ]
  },
  {
    id: 'cardio',
    question: "How do you handle pressure?",
    options: [
      { text: "I thrive in chaos 🔥", value: { aggression: 3, defense: 0, cardio: 2 } },
      { text: "Stay calm, stick to the plan 🧊", value: { aggression: 0, defense: 3, cardio: 2 } },
      { text: "Push the pace, make them break 💨", value: { aggression: 2, defense: 1, cardio: 3 } },
      { text: "Weather the storm, then attack ⛈️", value: { aggression: 1, defense: 2, cardio: 1 } },
    ]
  },
  {
    id: 'finish',
    question: "How do you want to win?",
    options: [
      { text: "Knockout, highlight reel 💥", value: { striking: 3, grappling: 0, finish: 3 } },
      { text: "Submission, make them tap 🦴", value: { striking: 0, grappling: 3, finish: 3 } },
      { text: "Dominant decision, 30-27 📋", value: { striking: 1, grappling: 1, finish: 0 } },
      { text: "Ground and pound until the ref stops it 🩸", value: { striking: 2, grappling: 2, finish: 2 } },
    ]
  },
  {
    id: 'style',
    question: "Pick your vibe:",
    options: [
      { text: "Explosive power, one shot changes everything ⚡", value: { striking: 3, aggression: 2, defense: 0 } },
      { text: "Technical wizard, always three steps ahead 🧠", value: { striking: 2, defense: 3, cardio: 1 } },
      { text: "Relentless pressure, a nightmare to fight 😈", value: { grappling: 2, aggression: 3, cardio: 3 } },
      { text: "Well-rounded, dangerous everywhere 🎪", value: { striking: 2, grappling: 2, defense: 2 } },
    ]
  },
  {
    id: 'mental',
    question: "Your opponent talks trash before the fight. You:",
    options: [
      { text: "Talk back louder 🗣️", value: { aggression: 3, striking: 1 } },
      { text: "Let your hands do the talking 🤫", value: { striking: 2, defense: 1 } },
      { text: "Smile and wave, then dominate 😏", value: { grappling: 2, defense: 2 } },
      { text: "Use it as fuel, stay focused 🎯", value: { cardio: 2, aggression: 1 } },
    ]
  },
];

// Fighter archetypes with stat profiles
const ARCHETYPES = {
  striker: { slpm: 0.4, str_acc: 0.3, td_avg: 0.05, sub_avg: 0.05, str_def: 0.1, td_def: 0.1 },
  grappler: { slpm: 0.1, str_acc: 0.1, td_avg: 0.35, sub_avg: 0.25, str_def: 0.1, td_def: 0.1 },
  balanced: { slpm: 0.2, str_acc: 0.2, td_avg: 0.15, sub_avg: 0.15, str_def: 0.15, td_def: 0.15 },
  pressure: { slpm: 0.3, str_acc: 0.15, td_avg: 0.2, sub_avg: 0.1, str_def: 0.1, td_def: 0.15 },
  counter: { slpm: 0.15, str_acc: 0.25, td_avg: 0.1, sub_avg: 0.1, str_def: 0.25, td_def: 0.15 },
};

// Star Power Tiers - Prioritize recognizable fighters
// Tier 1: GOATs, P4P Kings, Mega Stars (+150 bonus)
// Tier 2: Current Champions, Hall of Famers, Dominant Former Champs (+100 bonus)
// Tier 3: Former Champions, P4P Ranked, Big Names (+60 bonus)
// Tier 4: Popular Fighters, Contenders, Fan Favorites (+30 bonus)
const STAR_POWER = {
  // === TIER 1: GOAT STATUS / MEGA STARS (+150) ===
  'Jon Jones': 150,
  'Khabib Nurmagomedov': 150,
  'Georges St-Pierre': 150,
  'Anderson Silva': 150,
  'Conor McGregor': 150,
  'Amanda Nunes': 150,
  'Demetrious Johnson': 150,

  // === TIER 2: CURRENT CHAMPIONS & HALL OF FAMERS (+100) ===
  // Current Champions (2024-2025)
  'Islam Makhachev': 100,
  'Alex Pereira': 100,
  'Dricus Du Plessis': 100,
  'Belal Muhammad': 100,
  'Ilia Topuria': 100,
  'Merab Dvalishvili': 100,
  'Alexandre Pantoja': 100,
  'Zhang Weili': 100,
  'Valentina Shevchenko': 100,
  'Alexa Grasso': 100,
  // Hall of Famers
  'Ronda Rousey': 100,
  'Daniel Cormier': 100,
  'Stipe Miocic': 100,
  'Jose Aldo': 100,
  'Chuck Liddell': 100,
  'Randy Couture': 100,
  'Matt Hughes': 100,
  'Tito Ortiz': 100,
  'Royce Gracie': 100,
  'BJ Penn': 100,
  'Forrest Griffin': 100,
  'Michael Bisping': 100,
  'Urijah Faber': 100,
  'Bas Rutten': 100,
  'Ken Shamrock': 100,
  'Don Frye': 100,
  'Mark Coleman': 100,
  'Dan Severn': 100,

  // === TIER 3: FORMER CHAMPIONS & BIG NAMES (+60) ===
  // Former Champions / P4P Ranked
  'Israel Adesanya': 60,
  'Max Holloway': 60,
  'Dustin Poirier': 60,
  'Charles Oliveira': 60,
  'Kamaru Usman': 60,
  'Francis Ngannou': 60,
  'Sean O\'Malley': 60,
  'Leon Edwards': 60,
  'Alexander Volkanovski': 60,
  'Henry Cejudo': 60,
  'TJ Dillashaw': 60,
  'Dominick Cruz': 60,
  'Robert Whittaker': 60,
  'Chris Weidman': 60,
  'Luke Rockhold': 60,
  'Lyoto Machida': 60,
  'Mauricio Rua': 60,
  'Quinton Jackson': 60,
  'Vitor Belfort': 60,
  'Wanderlei Silva': 60,
  'Mirko Cro Cop': 60,
  'Cain Velasquez': 60,
  'Junior Dos Santos': 60,
  'Brock Lesnar': 60,
  'Tyron Woodley': 60,
  'Robbie Lawler': 60,
  'Anthony Pettis': 60,
  'Eddie Alvarez': 60,
  'Rafael Dos Anjos': 60,
  'Frankie Edgar': 60,
  'Rose Namajunas': 60,
  'Joanna Jedrzejczyk': 60,
  'Carla Esparza': 60,
  'Miesha Tate': 60,
  'Holly Holm': 60,
  'Cris Cyborg': 60,
  'Glover Teixeira': 60,
  'Jan Blachowicz': 60,
  'Jiri Prochazka': 60,
  'Brandon Moreno': 60,
  'Deiveson Figueiredo': 60,
  'Aljamain Sterling': 60,
  'Petr Yan': 60,

  // === TIER 4: POPULAR FIGHTERS & CONTENDERS (+30) ===
  'Nate Diaz': 30,
  'Nick Diaz': 30,
  'Jorge Masvidal': 30,
  'Colby Covington': 30,
  'Justin Gaethje': 30,
  'Tony Ferguson': 30,
  'Michael Chandler': 30,
  'Beneil Dariush': 30,
  'Paddy Pimblett': 30,
  'Sean Strickland': 30,
  'Paulo Costa': 30,
  'Marvin Vettori': 30,
  'Yoel Romero': 30,
  'Derek Brunson': 30,
  'Gilbert Burns': 30,
  'Vicente Luque': 30,
  'Stephen Thompson': 30,
  'Demian Maia': 30,
  'Carlos Condit': 30,
  'Matt Brown': 30,
  'Donald Cerrone': 30,
  'Jim Miller': 30,
  'Clay Guida': 30,
  'Cory Sandhagen': 30,
  'Marlon Vera': 30,
  'Song Yadong': 30,
  'Ciryl Gane': 30,
  'Tom Aspinall': 30,
  'Curtis Blaydes': 30,
  'Derrick Lewis': 30,
  'Tai Tuivasa': 30,
  'Jamahal Hill': 30,
  'Magomed Ankalaev': 30,
  'Jessica Andrade': 30,
  'Yan Xiaonan': 30,
  'Tatiana Suarez': 30,
  'Kayla Harrison': 30,
  'Maycee Barber': 30,
  'Katlyn Chookagian': 30,
  'Bo Nickal': 30,
  'Shavkat Rakhmonov': 30,
  'Arman Tsarukyan': 30,
  'Movsar Evloev': 30,
  'Diego Lopes': 30,
  'Dan Hooker': 30,
  'Brad Riddell': 30,
  'Renato Moicano': 30,
  'Brian Ortega': 30,
  'Yair Rodriguez': 30,
  'Arnold Allen': 30,
  'Calvin Kattar': 30,
};

// Helper to get star power bonus (case-insensitive matching)
const getStarPower = (fighterName) => {
  if (!fighterName) return 0;
  const normalized = fighterName.trim();
  // Direct match
  if (STAR_POWER[normalized]) return STAR_POWER[normalized];
  // Case-insensitive match
  const lowerName = normalized.toLowerCase();
  for (const [name, bonus] of Object.entries(STAR_POWER)) {
    if (name.toLowerCase() === lowerName) return bonus;
  }
  return 0;
};

export default function UFCFighterQuiz() {
  const [stage, setStage] = useState('intro'); // intro, quiz, loading, result, shared
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState({ striking: 0, grappling: 0, aggression: 0, defense: 0, cardio: 0, finish: 0 });
  const [matchedFighter, setMatchedFighter] = useState(null);
  const [topMatches, setTopMatches] = useState([]); // Top 3 fighters with scores
  const [allFighters, setAllFighters] = useState([]);
  const [fadeIn, setFadeIn] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [sharedBy, setSharedBy] = useState(null); // Name of person who shared
  const [sharedFighter, setSharedFighter] = useState(null); // Fighter from shared URL
  const [error, setError] = useState(null); // Error state for API failures
  const [quizStats, setQuizStats] = useState({ totalQuizzes: 0, topFighters: [] }); // Global stats
  const [fighterStats, setFighterStats] = useState(null); // Stats for matched fighter
  const resultRef = useRef(null);
  const resultCardRef = useRef(null);

  // Fetch global stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/stats`);
        if (response.ok) {
          const data = await response.json();
          setQuizStats(data);
        }
      } catch (error) {
        console.log('Stats not available yet:', error.message);
      }
    };
    fetchStats();
  }, []);

  // Fetch ALL fighters on mount (single API call)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fighterSlug = params.get('result');
    const name = params.get('from');

    const fetchAllFighters = async () => {
      try {
        // Single API call to get all fighters
        const response = await fetch(`${API_BASE}/api/fighters?limit=10000`);
        const data = await response.json();
        const allData = data.data || [];

        console.log(`Loaded ${allData.length} fighters from API (single call)`);

        // Filter to fighters with decent records and stats
        const qualified = allData.filter(f =>
          f.wins >= 3 &&
          f.name &&
          (f.wins + f.losses) >= 5
        );

        console.log(`${qualified.length} qualified fighters for matching`);
        setAllFighters(qualified);

        // Check for shared result URL
        if (fighterSlug) {
          const fighterName = fighterSlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          // Search in ALL fighters (not just qualified) for shared links
          const fighter = allData.find(f =>
            f.name.toLowerCase() === fighterName.toLowerCase()
          );
          if (fighter) {
            setSharedFighter(fighter);
            setSharedBy(name ? decodeURIComponent(name) : null);
            setStage('shared');
          }
        }
      } catch (error) {
        console.error('Failed to fetch fighters:', error);
      }
    };

    fetchAllFighters();
  }, []);

  const handleAnswer = (option) => {
    // Fade out
    setFadeIn(false);
    
    setTimeout(() => {
      // Update scores
      const newScores = { ...scores };
      Object.entries(option.value).forEach(([key, val]) => {
        newScores[key] = (newScores[key] || 0) + val;
      });
      setScores(newScores);
      setAnswers({ ...answers, [QUESTIONS[currentQuestion].id]: option });

      if (currentQuestion < QUESTIONS.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setStage('loading');
        findMatch(newScores);
      }
      setFadeIn(true);
    }, 300);
  };

  // Helper: Calculate fighter's finish rate and style from fight history
  const analyzeFighterStyle = (fighter) => {
    const fights = fighter.fights || [];
    const wins = fights.filter(f => f.result === 'win');

    let koWins = 0, subWins = 0, decWins = 0;

    wins.forEach(fight => {
      const method = (fight.method || '').toUpperCase();
      if (method.includes('KO') || method.includes('TKO') || method.includes('KNOCK')) {
        koWins++;
      } else if (method.includes('SUB') || method.includes('CHOKE') || method.includes('LOCK') || method.includes('TAP')) {
        subWins++;
      } else {
        decWins++;
      }
    });

    const totalWins = wins.length || 1;

    // Check recent activity (last fight within 2 years = active)
    let isActive = false;
    if (fights.length > 0) {
      const lastFight = fights[0];
      if (lastFight.event_date) {
        const lastDate = new Date(lastFight.event_date);
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        isActive = lastDate > twoYearsAgo;
      }
    }

    return {
      koRate: koWins / totalWins,
      subRate: subWins / totalWins,
      decRate: decWins / totalWins,
      finishRate: (koWins + subWins) / totalWins,
      isActive,
      totalFights: fights.length
    };
  };

  const findMatch = (finalScores) => {
    // Check if fighters were loaded
    if (allFighters.length === 0) {
      setError('Unable to load fighter data. The API may be temporarily unavailable. Please try again later.');
      setStage('error');
      return;
    }

    // Calculate user's style profile
    const total = Object.values(finalScores).reduce((a, b) => a + b, 0) || 1;
    const normalized = {};
    Object.entries(finalScores).forEach(([k, v]) => {
      normalized[k] = v / total;
    });

    // Determine user's fighting DNA
    const strikingScore = normalized.striking || 0;
    const grapplingScore = normalized.grappling || 0;
    const aggressionScore = normalized.aggression || 0;
    const defenseScore = normalized.defense || 0;
    const cardioScore = normalized.cardio || 0;
    const finishScore = normalized.finish || 0;

    // Score each fighter
    const scored = allFighters.map(fighter => {
      let score = 0;
      const style = analyzeFighterStyle(fighter);

      // === STRIKING VS GRAPPLING (40% weight) ===
      const fighterStrikingRating = ((fighter.slpm || 0) / 6) * 0.5 + (fighter.str_acc || 0) * 0.5;
      const fighterGrapplingRating = ((fighter.td_avg || 0) / 4) * 0.4 + ((fighter.sub_avg || 0) / 2) * 0.6;

      // Match to user preference
      score += strikingScore * fighterStrikingRating * 100;
      score += grapplingScore * fighterGrapplingRating * 100;

      // === AGGRESSION VS DEFENSE (25% weight) ===
      // Aggressive = high output, absorbs strikes, low defense %
      const fighterAggressionRating = ((fighter.slpm || 0) / 6) * 0.5 + ((fighter.sapm || 0) / 5) * 0.3 + (1 - (fighter.str_def || 0.5)) * 0.2;
      // Defensive = high defense %, low absorption
      const fighterDefenseRating = (fighter.str_def || 0) * 0.4 + (fighter.td_def || 0) * 0.4 + (1 - Math.min((fighter.sapm || 0) / 5, 1)) * 0.2;

      score += aggressionScore * fighterAggressionRating * 80;
      score += defenseScore * fighterDefenseRating * 80;

      // === CARDIO/PRESSURE (15% weight) ===
      // High cardio = high volume, goes to decisions, active in later rounds
      const volumeRating = Math.min((fighter.slpm || 0) / 5, 1);
      score += cardioScore * volumeRating * 50;

      // === FINISHING ABILITY (20% weight) ===
      if (finishScore > 0.1) {
        // User wants finishes - match to fighters who finish fights
        score += finishScore * style.finishRate * 70;

        // Bonus for KO artists if striker, sub artists if grappler
        if (strikingScore > grapplingScore) {
          score += style.koRate * 30;
        } else {
          score += style.subRate * 30;
        }
      }

      // === STAR POWER BONUS (BIG IMPACT) ===
      // This ensures famous fighters rank higher
      const starPower = getStarPower(fighter.name);
      score += starPower;

      // === BONUSES FOR RECOGNIZABILITY ===
      // Current champion bonus (on top of star power)
      if (fighter.is_champion) {
        score += 40;
      }

      // Win record bonus (more wins = more experienced/known)
      const winBonus = Math.min(fighter.wins || 0, 20);
      score += winBonus * 1.2;

      // Win rate bonus (quality over quantity)
      const winRate = fighter.wins / Math.max(fighter.wins + fighter.losses, 1);
      score += winRate * 15;

      // Active fighter bonus (fought recently)
      if (style.isActive) {
        score += 20;
      }

      // Penalize fighters with no stats (likely inactive/old)
      if ((fighter.slpm || 0) === 0 && (fighter.td_avg || 0) === 0) {
        score -= 80;
      }

      // Experience bonus (more fights = more reliable data)
      score += Math.min(style.totalFights, 15) * 0.3;

      // Add randomization factor (±10%) for variety between runs
      // This shuffles the top matches so same answers can give different results
      const randomFactor = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1
      score *= randomFactor;

      return { fighter, score, style, starPower };
    });

    // Filter out very low scores and sort
    const validScored = scored.filter(s => s.score > 0);
    validScored.sort((a, b) => b.score - a.score);

    // Calculate max score for percentage
    const maxScore = validScored[0]?.score || 1;

    // Get top 8 for variety pool, display top 5
    const top8 = validScored.slice(0, 8).map((item, index) => ({
      fighter: item.fighter,
      score: item.score,
      style: item.style,
      starPower: item.starPower,
      percentage: Math.round((item.score / maxScore) * 100),
      rank: index + 1
    }));

    // Weighted random selection from top 5 for variety
    // More even weights for better variety: #1=28%, #2=24%, #3=20%, #4=16%, #5=12%
    // This gives good variety while still slightly favoring better matches
    const pickWeighted = () => {
      const weights = [28, 24, 20, 16, 12];
      const available = Math.min(top8.length, 5);
      const totalWeight = weights.slice(0, available).reduce((a, b) => a + b, 0);
      let random = Math.random() * totalWeight;

      for (let i = 0; i < available; i++) {
        random -= weights[i];
        if (random <= 0) return i;
      }
      return 0;
    };

    const randomIndex = pickWeighted();
    const match = top8[randomIndex]?.fighter || validScored[0]?.fighter;
    const top5 = top8.slice(0, 5);

    // Build top 3 with selected match first
    const reorderedTop3 = [
      { ...top5[randomIndex], percentage: 100 },
      ...top5.filter((_, i) => i !== randomIndex).slice(0, 2).map(item => ({
        ...item,
        percentage: Math.round((item.score / top5[randomIndex].score) * 100)
      }))
    ];

    // Log for debugging
    console.log('Top 5 matches:', top5.map(t =>
      `${t.fighter.name} (Score: ${t.score.toFixed(1)}, Star: ${t.starPower || 0})`
    ));
    console.log(`Selected #${randomIndex + 1}: ${match?.name}`);

    setTimeout(() => {
      setMatchedFighter(match);
      setTopMatches(reorderedTop3);
      setStage('result');
      // Record this result to stats
      recordResult(match);
    }, 2000);
  };

  // Record quiz result to stats API
  const recordResult = async (fighter) => {
    if (!fighter) return;

    const fighterSlug = fighter.name.toLowerCase().replace(/\s+/g, '-');

    try {
      const response = await fetch(`${API_BASE}/api/stats/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fighterSlug,
          fighterName: fighter.name
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local stats
        setQuizStats(prev => ({
          ...prev,
          totalQuizzes: data.totalQuizzes
        }));

        // Fetch detailed fighter stats
        const statsResponse = await fetch(`${API_BASE}/api/stats/fighter/${fighterSlug}`);
        if (statsResponse.ok) {
          const fighterData = await statsResponse.json();
          setFighterStats(fighterData);
        }
      }
    } catch (error) {
      console.log('Could not record stats:', error.message);
    }
  };

  const getStyleDescription = () => {
    const isStriker = scores.striking > scores.grappling;
    const isAggressive = scores.aggression > scores.defense;
    
    if (isStriker && isAggressive) return "Aggressive Striker";
    if (isStriker && !isAggressive) return "Technical Counter-Striker";
    if (!isStriker && isAggressive) return "Pressure Grappler";
    return "Calculated Submission Artist";
  };

  const getMatchReason = () => {
    if (!matchedFighter) return "";
    const reasons = [];
    
    if (scores.striking > scores.grappling) {
      if (matchedFighter.slpm > 4) reasons.push("high-volume striking");
      if (matchedFighter.str_acc > 0.5) reasons.push("precision accuracy");
    } else {
      if (matchedFighter.td_avg > 2) reasons.push("elite takedown game");
      if (matchedFighter.sub_avg > 0.5) reasons.push("submission threat");
    }
    
    if (scores.defense > scores.aggression) {
      if (matchedFighter.str_def > 0.55) reasons.push("defensive mastery");
    } else {
      reasons.push("aggressive fighting style");
    }
    
    return reasons.slice(0, 2).join(" and ");
  };

  const restart = () => {
    setStage('intro');
    setCurrentQuestion(0);
    setAnswers({});
    setScores({ striking: 0, grappling: 0, aggression: 0, defense: 0, cardio: 0, finish: 0 });
    setMatchedFighter(null);
    setTopMatches([]);
    setError(null);
    setFighterStats(null);
  };

  // Download result as image
  const downloadAsImage = async () => {
    if (!resultCardRef.current) return;
    setIsDownloading(true);

    try {
      // Load html2canvas if not already loaded
      if (!window.html2canvas) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const canvas = await window.html2canvas(resultCardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `ufc-alter-ego-${matchedFighter.name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Try taking a screenshot instead!');
    } finally {
      setIsDownloading(false);
    }
  };

  // Generate shareable URL with fighter result
  const getShareableUrl = (includeFrom = false, customName = null) => {
    const baseUrl = 'https://ufcapi.aristotle.me/quiz';
    const fighterSlug = matchedFighter.name.toLowerCase().replace(/\s+/g, '-');
    let url = `${baseUrl}?result=${fighterSlug}`;
    if (includeFrom && customName) {
      url += `&from=${encodeURIComponent(customName)}`;
    }
    return url;
  };

  // Share to Twitter
  const shareToTwitter = () => {
    const url = getShareableUrl();
    const nickname = matchedFighter.nickname ? ` "${matchedFighter.nickname}"` : '';
    const text = `I fight like${nickname} ${matchedFighter.name}! 🥊🔥\n\nFind YOUR UFC alter ego →`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  // Copy link to clipboard
  const copyLink = () => {
    const url = getShareableUrl();
    navigator.clipboard.writeText(url);
    return url;
  };

  // Start quiz from shared view
  const startFromShared = () => {
    // Clear URL params
    window.history.replaceState({}, '', window.location.pathname);
    setSharedFighter(null);
    setSharedBy(null);
    setStage('intro');
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: '"Bebas Neue", "Impact", sans-serif',
      position: 'relative',
      overflow: 'hidden',
    },
    noiseOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      opacity: 0.03,
      pointerEvents: 'none',
      zIndex: 1,
    },
    gradientBg: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'radial-gradient(ellipse at 20% 20%, rgba(220, 38, 38, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(212, 175, 55, 0.1) 0%, transparent 50%)',
      zIndex: 0,
    },
    content: {
      position: 'relative',
      zIndex: 2,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '15px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.gradientBg} />
      <div style={styles.noiseOverlay} />
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@400;500;700&display=swap');
        
        * { box-sizing: border-box; }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.3); }
          50% { box-shadow: 0 0 40px rgba(212, 175, 55, 0.6); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px) rotate(-1deg); }
          75% { transform: translateX(5px) rotate(1deg); }
        }

        .fade-in { animation: slideUp 0.5s ease-out; }
        .fade-out { opacity: 0; transform: translateY(-20px); transition: all 0.3s; }
      `}</style>

      <div style={styles.content}>
        {/* INTRO SCREEN */}
        {stage === 'intro' && (
          <div style={{ textAlign: 'center', maxWidth: '600px' }} className="fade-in">
            <div style={{
              fontSize: '12px',
              letterSpacing: '8px',
              color: '#d4af37',
              marginBottom: '20px',
              fontFamily: 'Oswald, sans-serif',
            }}>
              DISCOVER YOUR
            </div>
            
            <h1 style={{
              fontSize: 'clamp(3rem, 12vw, 6rem)',
              fontWeight: 400,
              lineHeight: 0.9,
              margin: '0 0 10px 0',
              background: 'linear-gradient(180deg, #fff 0%, #888 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              UFC FIGHTER
            </h1>
            
            <div style={{
              fontSize: 'clamp(2rem, 8vw, 4rem)',
              color: '#d4af37',
              marginBottom: '40px',
              textShadow: '0 0 30px rgba(212, 175, 55, 0.5)',
            }}>
              ALTER EGO
            </div>

            <p style={{
              fontFamily: 'Oswald, sans-serif',
              fontSize: '1.1rem',
              color: '#888',
              fontWeight: 400,
              lineHeight: 1.6,
              marginBottom: '50px',
              letterSpacing: '1px',
            }}>
              Answer 5 questions to find out which UFC fighter matches your fighting spirit
            </p>

            <button
              onClick={() => setStage('quiz')}
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                border: 'none',
                color: '#fff',
                padding: '20px 60px',
                fontSize: '1.5rem',
                fontFamily: 'Bebas Neue, sans-serif',
                letterSpacing: '4px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 10px 40px rgba(220, 38, 38, 0.4)';
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              START THE QUIZ
            </button>

            {/* Stats Counter - Social Proof */}
            {quizStats.totalQuizzes > 0 && (
              <div style={{
                marginTop: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}>
                <span style={{ fontSize: '1rem' }}>🔥</span>
                <span style={{
                  fontFamily: 'Oswald, sans-serif',
                  fontSize: '0.9rem',
                  color: '#888',
                  letterSpacing: '1px',
                }}>
                  <span style={{ color: '#d4af37', fontFamily: 'Bebas Neue' }}>{quizStats.totalQuizzes.toLocaleString()}</span> fighters discovered their alter ego
                </span>
              </div>
            )}

            <div style={{
              marginTop: quizStats.totalQuizzes > 0 ? '20px' : '60px',
              fontSize: '11px',
              color: '#555',
              fontFamily: 'Oswald, sans-serif',
              letterSpacing: '2px',
            }}>
              POWERED BY <a href="https://ufcapi.aristotle.me" target="_blank" rel="noopener noreferrer" style={{ color: '#d4af37', textDecoration: 'none' }}>UFC STATS API</a>
            </div>
          </div>
        )}

        {/* QUIZ SCREEN */}
        {stage === 'quiz' && (
          <div style={{ maxWidth: '700px', width: '100%' }} className={fadeIn ? 'fade-in' : 'fade-out'}>
            {/* Progress bar */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '40px',
              justifyContent: 'center',
            }}>
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '60px',
                    height: '4px',
                    background: i <= currentQuestion ? '#d4af37' : '#333',
                    transition: 'background 0.3s',
                  }}
                />
              ))}
            </div>

            {/* Question number */}
            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: '#d4af37',
              letterSpacing: '4px',
              marginBottom: '20px',
              fontFamily: 'Oswald, sans-serif',
            }}>
              QUESTION {currentQuestion + 1} OF {QUESTIONS.length}
            </div>

            {/* Question */}
            <h2 style={{
              textAlign: 'center',
              fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
              marginBottom: '50px',
              lineHeight: 1.2,
            }}>
              {QUESTIONS[currentQuestion].question}
            </h2>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {QUESTIONS[currentQuestion].options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(option)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    padding: '25px 30px',
                    fontSize: '1.2rem',
                    fontFamily: 'Oswald, sans-serif',
                    fontWeight: 500,
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    e.target.style.background = 'rgba(212, 175, 55, 0.1)';
                    e.target.style.borderColor = '#d4af37';
                    e.target.style.transform = 'translateX(10px)';
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'translateX(0)';
                  }}
                >
                  <span style={{ color: '#d4af37', marginRight: '15px' }}>
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* LOADING SCREEN */}
        {stage === 'loading' && (
          <div style={{ textAlign: 'center' }} className="fade-in">
            <div style={{
              width: '80px',
              height: '80px',
              border: '3px solid #333',
              borderTopColor: '#d4af37',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 30px',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <div style={{
              fontSize: '1.5rem',
              fontFamily: 'Oswald, sans-serif',
              letterSpacing: '3px',
              color: '#888',
            }}>
              ANALYZING YOUR FIGHTER DNA...
            </div>
          </div>
        )}

        {/* ERROR SCREEN */}
        {stage === 'error' && (
          <div style={{ textAlign: 'center', maxWidth: '500px' }} className="fade-in">
            <div style={{
              fontSize: '4rem',
              marginBottom: '20px',
            }}>
              ⚠️
            </div>

            <h2 style={{
              fontSize: '2rem',
              color: '#dc2626',
              marginBottom: '20px',
              fontFamily: 'Bebas Neue, sans-serif',
              letterSpacing: '2px',
            }}>
              CONNECTION ERROR
            </h2>

            <p style={{
              fontFamily: 'Oswald, sans-serif',
              fontSize: '1.1rem',
              color: '#888',
              lineHeight: 1.6,
              marginBottom: '40px',
            }}>
              {error || 'Something went wrong. Please try again.'}
            </p>

            <button
              onClick={restart}
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                border: 'none',
                color: '#fff',
                padding: '18px 50px',
                fontSize: '1.3rem',
                fontFamily: 'Bebas Neue, sans-serif',
                letterSpacing: '3px',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 10px 40px rgba(220, 38, 38, 0.4)';
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {/* SHARED RESULT SCREEN */}
        {stage === 'shared' && sharedFighter && (
          <div style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }} className="fade-in">
            {/* Challenge Header with Fighter Reveal */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)',
              border: '2px solid rgba(212, 175, 55, 0.4)',
              padding: '30px',
              marginBottom: '25px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Decorative corner accents */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '20px',
                height: '20px',
                borderTop: '3px solid #d4af37',
                borderLeft: '3px solid #d4af37',
              }} />
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '20px',
                height: '20px',
                borderTop: '3px solid #d4af37',
                borderRight: '3px solid #d4af37',
              }} />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '20px',
                height: '20px',
                borderBottom: '3px solid #d4af37',
                borderLeft: '3px solid #d4af37',
              }} />
              <div style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '20px',
                height: '20px',
                borderBottom: '3px solid #d4af37',
                borderRight: '3px solid #d4af37',
              }} />

              <div style={{
                fontSize: '11px',
                letterSpacing: '5px',
                color: '#d4af37',
                marginBottom: '15px',
                fontFamily: 'Oswald, sans-serif',
                textTransform: 'uppercase',
              }}>
                {sharedBy ? `${sharedBy} found their fighter` : 'Your friend found their fighter'}
              </div>

              {sharedFighter.nickname && (
                <div style={{
                  fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                  color: '#d4af37',
                  fontFamily: 'Bebas Neue, sans-serif',
                  letterSpacing: '2px',
                  marginBottom: '5px',
                  textShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
                }}>
                  "{sharedFighter.nickname.toUpperCase()}"
                </div>
              )}

              <h2 style={{
                fontSize: 'clamp(2rem, 8vw, 2.8rem)',
                margin: '0 0 15px 0',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}>
                {sharedFighter.name}
              </h2>

              <div style={{
                display: 'inline-block',
                background: 'rgba(220, 38, 38, 0.25)',
                border: '1px solid rgba(220, 38, 38, 0.4)',
                padding: '8px 25px',
              }}>
                <span style={{ fontSize: '1.5rem', fontFamily: 'Bebas Neue' }}>
                  {sharedFighter.wins}-{sharedFighter.losses}-{sharedFighter.draws || 0}
                </span>
              </div>
            </div>

            {/* Challenge Question */}
            <div style={{
              fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
              fontFamily: 'Oswald, sans-serif',
              color: '#fff',
              marginBottom: '30px',
              lineHeight: 1.4,
            }}>
              Think you fight like <span style={{ color: '#d4af37' }}>{sharedFighter.name.split(' ')[sharedFighter.name.split(' ').length - 1]}</span> too?
              <br />
              <span style={{ color: '#888', fontSize: '0.85em' }}>Or are you a completely different beast?</span>
            </div>

            {/* CTA Button */}
            <button
              onClick={startFromShared}
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                border: 'none',
                color: '#fff',
                padding: '22px 50px',
                fontSize: '1.4rem',
                fontFamily: 'Bebas Neue, sans-serif',
                letterSpacing: '4px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                width: '100%',
                maxWidth: '380px',
                animation: 'pulse 2s ease-in-out infinite',
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'scale(1.03)';
                e.target.style.boxShadow = '0 10px 40px rgba(220, 38, 38, 0.5)';
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              DISCOVER YOUR ALTER EGO
            </button>

            <div style={{
              marginTop: '15px',
              fontSize: '0.85rem',
              color: '#666',
              fontFamily: 'Oswald, sans-serif',
              letterSpacing: '1px',
            }}>
              5 questions • Takes 30 seconds
            </div>

            {/* Social Proof */}
            <div style={{
              marginTop: '35px',
              padding: '18px 25px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <span style={{ fontSize: '1.2rem' }}>🥊</span>
                <span style={{ fontSize: '1.2rem' }}>🔥</span>
                <span style={{ fontSize: '1.2rem' }}>👊</span>
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: '#888',
                fontFamily: 'Oswald, sans-serif',
                letterSpacing: '1px',
              }}>
                {quizStats.totalQuizzes > 0 ? (
                  <>Join <span style={{ color: '#d4af37', fontFamily: 'Bebas Neue' }}>{quizStats.totalQuizzes.toLocaleString()}</span> others who found their alter ego</>
                ) : (
                  <>Join thousands who discovered their UFC alter ego</>
                )}
              </div>
            </div>

            {/* Powered by */}
            <div style={{
              marginTop: '30px',
              fontSize: '10px',
              color: '#444',
              fontFamily: 'Oswald, sans-serif',
              letterSpacing: '2px',
            }}>
              POWERED BY <a href="https://ufcapi.aristotle.me" target="_blank" rel="noopener noreferrer" style={{ color: '#d4af37', textDecoration: 'none' }}>UFC STATS API</a>
            </div>
          </div>
        )}

        {/* RESULT SCREEN */}
        {stage === 'result' && matchedFighter && (
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '40px',
            maxWidth: '850px',
            width: '100%',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }} className="fade-in" ref={resultRef}>
            {/* Result Card */}
            <div ref={resultCardRef} style={{
              background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)',
              border: '2px solid #d4af37',
              padding: '0',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(212, 175, 55, 0.1)',
              flex: '1 1 400px',
              maxWidth: '500px',
              minWidth: '300px',
            }}>
              {/* Top accent */}
              <div style={{
                height: '4px',
                background: 'linear-gradient(90deg, #d4af37, #f4d03f, #d4af37)',
              }} />

              {/* Header */}
              <div style={{
                background: 'rgba(212, 175, 55, 0.1)',
                padding: '15px',
                textAlign: 'center',
                borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
              }}>
                <div style={{
                  fontSize: '11px',
                  letterSpacing: '6px',
                  color: '#d4af37',
                  marginBottom: '5px',
                  fontFamily: 'Oswald, sans-serif',
                }}>
                  YOU FIGHT LIKE
                </div>
              </div>

              {/* Fighter Name */}
              <div style={{ padding: '30px 25px', textAlign: 'center' }}>
                {matchedFighter.nickname && (
                  <div style={{
                    fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
                    color: '#d4af37',
                    fontFamily: 'Bebas Neue, sans-serif',
                    letterSpacing: '3px',
                    marginBottom: '8px',
                    textShadow: '0 0 20px rgba(212, 175, 55, 0.4)',
                  }}>
                    "{matchedFighter.nickname.toUpperCase()}"
                  </div>
                )}

                <h1 style={{
                  fontSize: 'clamp(2.5rem, 10vw, 3.5rem)',
                  margin: '0 0 15px 0',
                  lineHeight: 1,
                  textTransform: 'uppercase',
                }}>
                  {matchedFighter.name}
                </h1>

                {/* Record */}
                <div style={{
                  display: 'inline-block',
                  background: 'rgba(220, 38, 38, 0.2)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  padding: '8px 20px',
                  marginBottom: '20px',
                }}>
                  <span style={{ fontSize: '1.8rem', fontFamily: 'Bebas Neue' }}>
                    {matchedFighter.wins}-{matchedFighter.losses}-{matchedFighter.draws || 0}
                  </span>
                </div>

                {/* Stats Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px',
                  marginBottom: '20px',
                }}>
                  <StatBox label="STRIKES/MIN" value={matchedFighter.slpm?.toFixed(2) || '0'} />
                  <StatBox label="STRIKE ACC" value={`${((matchedFighter.str_acc || 0) * 100).toFixed(0)}%`} />
                  <StatBox label="TD AVG" value={matchedFighter.td_avg?.toFixed(2) || '0'} />
                  <StatBox label="SUB AVG" value={matchedFighter.sub_avg?.toFixed(2) || '0'} />
                </div>

                {/* Match reason */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '15px',
                  borderLeft: '3px solid #d4af37',
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#888',
                    letterSpacing: '2px',
                    marginBottom: '8px',
                    fontFamily: 'Oswald, sans-serif',
                  }}>
                    YOUR FIGHTING STYLE
                  </div>
                  <div style={{
                    fontSize: '1.3rem',
                    color: '#d4af37',
                    fontFamily: 'Oswald, sans-serif',
                    fontWeight: 500,
                  }}>
                    {getStyleDescription()}
                  </div>
                  <div style={{
                    fontSize: '0.95rem',
                    color: '#aaa',
                    marginTop: '10px',
                    fontFamily: 'Oswald, sans-serif',
                    fontWeight: 400,
                  }}>
                    Matched for your {getMatchReason()}
                  </div>
                </div>

                {/* Fighter Stats - How many others got this result */}
                {fighterStats && fighterStats.count > 0 && (
                  <div style={{
                    marginTop: '15px',
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    padding: '15px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginBottom: '5px',
                    }}>
                      <span style={{ fontSize: '1.1rem' }}>👥</span>
                      <span style={{
                        fontFamily: 'Bebas Neue, sans-serif',
                        fontSize: '1.4rem',
                        color: '#d4af37',
                      }}>
                        {fighterStats.percentage}%
                      </span>
                      <span style={{
                        fontFamily: 'Oswald, sans-serif',
                        fontSize: '0.9rem',
                        color: '#888',
                      }}>
                        of people also fight like {matchedFighter.name.split(' ')[0]}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: 'Oswald, sans-serif',
                      fontSize: '0.75rem',
                      color: '#666',
                      letterSpacing: '1px',
                    }}>
                      You're 1 of {fighterStats.count.toLocaleString()} {matchedFighter.name.split(' ')[matchedFighter.name.split(' ').length - 1]}s
                      {fighterStats.rank && fighterStats.rank <= 10 && (
                        <span style={{ color: '#d4af37' }}> • #{fighterStats.rank} most common result</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Top 3 Matches */}
                {topMatches.length > 1 && (
                  <div style={{
                    marginTop: '15px',
                    padding: '0 15px 15px',
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: '#666',
                      letterSpacing: '3px',
                      marginBottom: '12px',
                      fontFamily: 'Oswald, sans-serif',
                      textAlign: 'center',
                    }}>
                      YOU ALSO FIGHT LIKE
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {topMatches.slice(1).map((match, index) => (
                        <div
                          key={match.fighter.id || index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(255, 255, 255, 0.02)',
                            padding: '12px 15px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{
                              fontFamily: 'Oswald, sans-serif',
                              fontSize: '1rem',
                              color: '#ccc',
                            }}>
                              {match.fighter.name}
                            </span>
                            {match.fighter.nickname && (
                              <span style={{
                                fontFamily: 'Oswald, sans-serif',
                                fontSize: '0.75rem',
                                color: '#888',
                                fontStyle: 'italic',
                              }}>
                                "{match.fighter.nickname}"
                              </span>
                            )}
                          </div>
                          <span style={{
                            fontFamily: 'Bebas Neue, sans-serif',
                            fontSize: '1.1rem',
                            color: '#d4af37',
                          }}>
                            {match.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.5)',
                padding: '10px',
                textAlign: 'center',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              }}>
                <div style={{
                  fontSize: '10px',
                  color: '#555',
                  letterSpacing: '2px',
                  fontFamily: 'Oswald, sans-serif',
                }}>
                  UFCAPI.ARISTOTLE.ME
                </div>
              </div>
            </div>

            {/* Share Section - Side Panel on Desktop */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '220px',
              minWidth: '200px',
              flex: '0 0 auto',
            }}>
              {/* Primary: Download Image */}
              <button
                onClick={downloadAsImage}
                disabled={isDownloading}
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  border: 'none',
                  color: '#fff',
                  padding: '14px 16px',
                  fontSize: '0.85rem',
                  fontFamily: 'Bebas Neue, sans-serif',
                  letterSpacing: '2px',
                  cursor: isDownloading ? 'wait' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: isDownloading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                }}
                onMouseEnter={e => {
                  if (!isDownloading) e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                {isDownloading ? 'SAVING...' : 'SAVE IMAGE'}
              </button>

              {/* Twitter/X Share */}
              <button
                onClick={shareToTwitter}
                style={{
                  background: '#000',
                  border: '2px solid #333',
                  color: '#fff',
                  padding: '12px 16px',
                  fontSize: '0.85rem',
                  fontFamily: 'Bebas Neue, sans-serif',
                  letterSpacing: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#fff'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#333'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                POST ON X
              </button>

              {/* Copy Link */}
              <button
                onClick={(e) => {
                  copyLink();
                  const btn = e.currentTarget;
                  const span = btn.querySelector('span');
                  span.textContent = 'COPIED!';
                  btn.style.borderColor = '#d4af37';
                  btn.style.color = '#d4af37';
                  setTimeout(() => {
                    span.textContent = 'COPY LINK';
                    btn.style.borderColor = '#333';
                    btn.style.color = '#888';
                  }, 1500);
                }}
                style={{
                  background: 'transparent',
                  border: '2px solid #333',
                  color: '#888',
                  padding: '12px 16px',
                  fontSize: '0.85rem',
                  fontFamily: 'Bebas Neue, sans-serif',
                  letterSpacing: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#d4af37';
                  e.currentTarget.style.color = '#d4af37';
                }}
                onMouseLeave={e => {
                  if (e.currentTarget.querySelector('span').textContent !== 'COPIED!') {
                    e.currentTarget.style.borderColor = '#333';
                    e.currentTarget.style.color = '#888';
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <span>COPY LINK</span>
              </button>

              {/* Tip */}
              <div style={{
                fontSize: '0.7rem',
                color: '#999',
                textAlign: 'center',
                fontFamily: 'Oswald, sans-serif',
                letterSpacing: '1px',
                lineHeight: 1.4,
              }}>
                Download image, then attach to your post!
              </div>

              {/* Try Again */}
              <button
                onClick={restart}
                style={{
                  background: 'transparent',
                  border: '1px solid #555',
                  color: '#aaa',
                  padding: '10px',
                  fontSize: '0.75rem',
                  fontFamily: 'Oswald, sans-serif',
                  letterSpacing: '2px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginTop: '10px',
                }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = '#aaa'}
              >
                ← TRY AGAIN
              </button>

              {/* API plug - compact */}
              <div style={{
                textAlign: 'center',
                marginTop: '15px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255,255,255,0.15)',
              }}>
                <a
                  href="https://ufcapi.aristotle.me/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#888',
                    textDecoration: 'none',
                    fontSize: '0.7rem',
                    fontFamily: 'Oswald, sans-serif',
                    letterSpacing: '1px',
                  }}
                >
                  BUILT WITH UFC STATS API
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      padding: '15px',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: '1.5rem',
        fontFamily: 'Bebas Neue, sans-serif',
        color: '#fff',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '10px',
        color: '#888',
        letterSpacing: '2px',
        fontFamily: 'Oswald, sans-serif',
      }}>
        {label}
      </div>
    </div>
  );
}
