import React, { useState, useRef, useCallback, useEffect } from 'react';

// 欧文モールス
const MORSE_LATIN = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.', ' ': '/'
};

// 和文モールス（カタカナ）
const MORSE_JAPANESE = {
  'イ': '.-', 'ロ': '.-.-', 'ハ': '-...', 'ニ': '-.-.', 'ホ': '-..', 
  'ヘ': '.', 'ト': '..-..', 'チ': '..-.', 'リ': '--.', 'ヌ': '....',
  'ル': '-.--.', 'ヲ': '.---', 'ワ': '-.-', 'カ': '.-..', 'ヨ': '--',
  'タ': '-.', 'レ': '---', 'ソ': '---.', 'ツ': '.--.', 'ネ': '--.-',
  'ナ': '.-.', 'ラ': '...', 'ム': '-', 'ウ': '..-', 'ヰ': '.-..-',
  'ノ': '..--', 'オ': '.-...', 'ク': '...-', 'ヤ': '.--', 'マ': '-..-',
  'ケ': '-.--', 'フ': '--..', 'コ': '----', 'エ': '-.---', 'テ': '.-.--',
  'ア': '--.--', 'サ': '-.-.-', 'キ': '-.-..', 'ユ': '-..--', 'メ': '-...-',
  'ミ': '..-.-', 'シ': '--.-.', 'ヱ': '.--..', 'ヒ': '--..-', 'モ': '-..-.',
  'セ': '.---.', 'ス': '---.-', 'ン': '.-.-.', 
  '゛': '..', '゜': '..--.',
  'ー': '.--.-',
  '、': '.-.-.-', '。': '.-.-..',
  ' ': '/'
};

// ひらがな→カタカナ変換
const hiraganaToKatakana = (str) => {
  return str.replace(/[\u3041-\u3096]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) + 0x60);
  });
};

// 濁音・半濁音を分解
const decomposeVoiced = (char) => {
  const voicedMap = {
    'ガ': 'カ゛', 'ギ': 'キ゛', 'グ': 'ク゛', 'ゲ': 'ケ゛', 'ゴ': 'コ゛',
    'ザ': 'サ゛', 'ジ': 'シ゛', 'ズ': 'ス゛', 'ゼ': 'セ゛', 'ゾ': 'ソ゛',
    'ダ': 'タ゛', 'ヂ': 'チ゛', 'ヅ': 'ツ゛', 'デ': 'テ゛', 'ド': 'ト゛',
    'バ': 'ハ゛', 'ビ': 'ヒ゛', 'ブ': 'フ゛', 'ベ': 'ヘ゛', 'ボ': 'ホ゛',
    'パ': 'ハ゜', 'ピ': 'ヒ゜', 'プ': 'フ゜', 'ペ': 'ヘ゜', 'ポ': 'ホ゜',
    'ヴ': 'ウ゛'
  };
  return voicedMap[char] || char;
};

// 樹形図のノード構造を構築
const buildMorseTree = (morseCode) => {
  const tree = { char: '', children: {} };
  Object.entries(morseCode).forEach(([char, code]) => {
    if (char === ' ' || char === '゛' || char === '゜') return;
    let node = tree;
    for (const signal of code) {
      if (!node.children[signal]) {
        node.children[signal] = { char: null, children: {} };
      }
      node = node.children[signal];
    }
    if (node.char) {
      node.char = node.char + '/' + char;
    } else {
      node.char = char;
    }
  });
  return tree;
};

export default function MorseCodeApp() {
  const [mode, setMode] = useState('japanese');
  const [text, setText] = useState('モールス');
  const [morseCode, setMorseCode] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [currentSignal, setCurrentSignal] = useState('');
  const [highlightPath, setHighlightPath] = useState([]);
  const [currentChar, setCurrentChar] = useState('');
  const [speed, setSpeed] = useState(150);
  const [morseTree, setMorseTree] = useState(() => buildMorseTree(MORSE_JAPANESE));
  const audioCtxRef = useRef(null);
  const stopRef = useRef(false);

  const currentMorseTable = mode === 'latin' ? MORSE_LATIN : MORSE_JAPANESE;

  useEffect(() => {
    setMorseTree(buildMorseTree(currentMorseTable));
    if (mode === 'latin') {
      setText('HELLO');
    } else {
      setText('モールス');
    }
  }, [mode]);

  const textToMorse = useCallback((input) => {
    if (mode === 'latin') {
      return input.toUpperCase().split('').map(char => MORSE_LATIN[char] || '').join(' ');
    } else {
      let processed = hiraganaToKatakana(input);
      let result = [];
      for (const char of processed) {
        const decomposed = decomposeVoiced(char);
        for (const c of decomposed) {
          if (MORSE_JAPANESE[c]) {
            result.push(MORSE_JAPANESE[c]);
          }
        }
      }
      return result.join(' ');
    }
  }, [mode]);

  useEffect(() => {
    setMorseCode(textToMorse(text));
  }, [text, textToMorse]);

  const playTone = useCallback((duration) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = 600;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);
  }, []);

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const getCharsToPlay = useCallback(() => {
    if (mode === 'latin') {
      return text.toUpperCase().split('');
    } else {
      let processed = hiraganaToKatakana(text);
      let chars = [];
      for (const char of processed) {
        const decomposed = decomposeVoiced(char);
        for (const c of decomposed) {
          if (MORSE_JAPANESE[c]) {
            chars.push(c);
          }
        }
      }
      return chars;
    }
  }, [text, mode]);

  const playMorse = useCallback(async () => {
    setIsPlaying(true);
    stopRef.current = false;
    const dotDuration = speed;
    const dashDuration = dotDuration * 3;
    const symbolGap = dotDuration;
    const letterGap = dotDuration * 3;
    const wordGap = dotDuration * 7;

    const chars = getCharsToPlay();
    
    for (let i = 0; i < chars.length; i++) {
      if (stopRef.current) break;
      const char = chars[i];
      const code = currentMorseTable[char];
      if (!code) continue;
      
      setCurrentChar(char);
      
      if (char === ' ') {
        setHighlightPath([]);
        await sleep(wordGap);
        continue;
      }

      const path = [];
      for (let j = 0; j < code.length; j++) {
        if (stopRef.current) break;
        const signal = code[j];
        path.push(signal);
        setHighlightPath([...path]);
        setCurrentSignal(signal);
        setIsFlashing(true);
        
        const duration = signal === '.' ? dotDuration : dashDuration;
        playTone(duration);
        await sleep(duration);
        
        setIsFlashing(false);
        if (j < code.length - 1) await sleep(symbolGap);
      }
      
      if (i < chars.length - 1) await sleep(letterGap);
    }
    
    setIsPlaying(false);
    setIsFlashing(false);
    setCurrentSignal('');
    setHighlightPath([]);
    setCurrentChar('');
  }, [text, speed, playTone, getCharsToPlay, currentMorseTable]);

  const stopMorse = useCallback(() => {
    stopRef.current = true;
    setIsPlaying(false);
    setIsFlashing(false);
    setCurrentSignal('');
    setHighlightPath([]);
    setCurrentChar('');
  }, []);

  // 放射状樹形図コンポーネント
  const RadialMorseTree = ({ tree, highlightPath, isJapanese }) => {
    const size = 700;
    const centerX = size / 2;
    const centerY = size / 2;
    const maxDepth = isJapanese ? 6 : 5;
    
    // 色の定義
    const colors = {
      dot: {
        base: '#3b82f6',      // 青
        highlight: '#60a5fa',
        glow: 'rgba(59, 130, 246, 0.6)'
      },
      dash: {
        base: '#f59e0b',      // オレンジ
        highlight: '#fbbf24',
        glow: 'rgba(245, 158, 11, 0.6)'
      }
    };
    
    const getRadius = (depth) => {
      const minRadius = 45;
      const maxRadius = size / 2 - 40;
      return minRadius + (maxRadius - minRadius) * (depth / maxDepth);
    };

    const collectNodes = (node, path = [], depth = 0, angleStart = 0, angleEnd = 2 * Math.PI) => {
      const nodes = [];
      const links = [];
      
      const angle = (angleStart + angleEnd) / 2;
      const radius = getRadius(depth);
      const x = centerX + radius * Math.cos(angle - Math.PI / 2);
      const y = centerY + radius * Math.sin(angle - Math.PI / 2);
      
      const isHighlighted = path.length > 0 && 
        highlightPath.length >= path.length && 
        path.every((p, i) => highlightPath[i] === p);
      
      const isCurrentNode = path.length > 0 && 
        highlightPath.length === path.length && 
        path.every((p, i) => highlightPath[i] === p);

      // 最後の信号を取得してノードの色を決定
      const lastSignal = path.length > 0 ? path[path.length - 1] : null;

      nodes.push({
        x, y, depth, path: [...path],
        char: node.char,
        isHighlighted,
        isCurrentNode,
        angle,
        lastSignal
      });

      const childKeys = Object.keys(node.children);
      if (childKeys.length > 0) {
        const sortedKeys = ['.', '-'].filter(k => childKeys.includes(k));
        const angleRange = angleEnd - angleStart;
        const childAngleSpan = angleRange / 2;
        
        sortedKeys.forEach((key, index) => {
          const childAngleStart = angleStart + index * childAngleSpan;
          const childAngleEnd = childAngleStart + childAngleSpan;
          const childPath = [...path, key];
          
          const childAngle = (childAngleStart + childAngleEnd) / 2;
          const childRadius = getRadius(depth + 1);
          const childX = centerX + childRadius * Math.cos(childAngle - Math.PI / 2);
          const childY = centerY + childRadius * Math.sin(childAngle - Math.PI / 2);
          
          const isLinkHighlighted = highlightPath.length > path.length && 
            childPath.every((p, i) => highlightPath[i] === p);
          
          links.push({
            x1: x, y1: y,
            x2: childX, y2: childY,
            signal: key,
            isHighlighted: isLinkHighlighted,
            depth
          });
          
          const childResult = collectNodes(
            node.children[key], 
            childPath, 
            depth + 1, 
            childAngleStart, 
            childAngleEnd
          );
          nodes.push(...childResult.nodes);
          links.push(...childResult.links);
        });
      }
      
      return { nodes, links };
    };

    const { nodes, links } = collectNodes(tree);

    // 深度ごとのリングを描画
    const rings = [];
    for (let d = 1; d <= maxDepth; d++) {
      rings.push(
        <circle
          key={`ring-${d}`}
          cx={centerX}
          cy={centerY}
          r={getRadius(d)}
          fill="none"
          stroke="rgba(255, 255, 255, 0.04)"
          strokeWidth="1"
        />
      );
    }

    return (
      <svg 
        width="100%" 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        style={{ maxWidth: '700px', margin: '0 auto', display: 'block' }}
      >
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.08)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.02)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          
          {/* ドット用グロー */}
          <filter id="dotGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* ダッシュ用グロー */}
          <filter id="dashGlow">
            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* 背景のグラデーション */}
        <circle cx={centerX} cy={centerY} r={size/2 - 10} fill="url(#centerGlow)" />
        
        {/* 深度リング */}
        {rings}
        
        {/* リンク（線）- ドットは太い点線（●を連想）、ダッシュは細い実線（━を連想） */}
        {links.map((link, i) => {
          const isDot = link.signal === '.';
          const color = isDot ? colors.dot : colors.dash;
          // ドット: 太い点線、ダッシュ: 細い実線
          const baseWidth = isDot ? 4 : 1.5;
          const highlightWidth = isDot ? 6 : 3;
          
          return (
            <line
              key={`link-${i}`}
              x1={link.x1}
              y1={link.y1}
              x2={link.x2}
              y2={link.y2}
              stroke={link.isHighlighted ? color.highlight : (isDot ? 'rgba(59, 130, 246, 0.4)' : 'rgba(245, 158, 11, 0.35)')}
              strokeWidth={link.isHighlighted ? highlightWidth : baseWidth}
              strokeDasharray={isDot ? '3 5' : 'none'}
              strokeLinecap="round"
              filter={link.isHighlighted ? (isDot ? 'url(#dotGlow)' : 'url(#dashGlow)') : 'none'}
              style={{ transition: 'all 0.15s ease' }}
            />
          );
        })}
        
        {/* ノード */}
        {nodes.map((node, i) => {
          const nodeSize = node.depth === 0 ? 44 : (node.char ? 26 : 8);
          const showLabel = node.depth === 0 || node.char;
          
          // ノードの色を最後の信号で決定
          let nodeColor, nodeStroke, textColor;
          if (node.depth === 0) {
            nodeColor = 'rgba(30, 30, 45, 1)';
            nodeStroke = 'rgba(255, 255, 255, 0.3)';
            textColor = 'rgba(255, 255, 255, 0.9)';
          } else if (node.isCurrentNode) {
            const c = node.lastSignal === '.' ? colors.dot : colors.dash;
            nodeColor = c.highlight;
            nodeStroke = c.highlight;
            textColor = '#1a1a1f';
          } else if (node.isHighlighted) {
            const c = node.lastSignal === '.' ? colors.dot : colors.dash;
            nodeColor = `${c.base}cc`;
            nodeStroke = c.highlight;
            textColor = '#ffffff';
          } else {
            const c = node.lastSignal === '.' ? colors.dot : colors.dash;
            nodeColor = node.char ? 'rgba(25, 25, 40, 0.95)' : `${c.base}40`;
            nodeStroke = `${c.base}50`;
            textColor = node.lastSignal === '.' ? 'rgba(147, 197, 253, 0.9)' : 'rgba(252, 211, 77, 0.9)';
          }
          
          return (
            <g key={`node-${i}`}>
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeSize / 2}
                fill={nodeColor}
                stroke={nodeStroke}
                strokeWidth={node.isCurrentNode ? 3 : (node.depth === 0 ? 2 : 1.5)}
                filter={node.isCurrentNode ? 'url(#strongGlow)' : 'none'}
                style={{ transition: 'all 0.15s ease' }}
              />
              
              {showLabel && (
                <text
                  x={node.x}
                  y={node.y + (node.depth === 0 ? 1 : 4)}
                  fill={textColor}
                  fontSize={node.depth === 0 ? 12 : 11}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="'Noto Sans JP', sans-serif"
                >
                  {node.depth === 0 ? 'START' : (node.char?.length > 2 ? node.char.substring(0,2) : node.char)}
                </text>
              )}
            </g>
          );
        })}
        
        {/* 凡例 */}
        <g transform={`translate(30, ${size - 70})`}>
          <text x="0" y="0" fill="rgba(255, 255, 255, 0.7)" fontSize="11" fontWeight="600" fontFamily="sans-serif">
            Signal Types
          </text>
          {/* ドットの凡例 - 太い点線 */}
          <line x1="0" y1="20" x2="40" y2="20" 
            stroke={colors.dot.base} strokeWidth="4" strokeDasharray="3 5" strokeLinecap="round" />
          <text x="50" y="24" fill={colors.dot.highlight} fontSize="10" fontFamily="'JetBrains Mono', monospace">
            ● DOT (短点)
          </text>
          {/* ダッシュの凡例 - 細い実線 */}
          <line x1="0" y1="40" x2="40" y2="40" 
            stroke={colors.dash.base} strokeWidth="1.5" strokeLinecap="round" />
          <text x="50" y="44" fill={colors.dash.highlight} fontSize="10" fontFamily="'JetBrains Mono', monospace">
            ━ DASH (長点)
          </text>
        </g>
      </svg>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0c0c14 0%, #151525 40%, #1a1a2e 70%, #0f0f1a 100%)',
      fontFamily: "'Noto Sans JP', 'Courier Prime', sans-serif",
      color: '#e5e5e5',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 装飾的背景 */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '20%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.04) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.04) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />
      
      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* ヘッダー */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '300',
            letterSpacing: '0.5em',
            background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #f59e0b, #fbbf24)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '6px'
          }}>
            MORSE
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.4)',
            letterSpacing: '0.25em',
            fontSize: '0.65rem',
            textTransform: 'uppercase'
          }}>
            {mode === 'japanese' ? '和文モールス信号' : 'International Code'}
          </p>
        </div>

        {/* コントロールパネル */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* 左パネル: 入力 */}
          <div style={{
            background: 'rgba(20, 20, 35, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
            backdropFilter: 'blur(10px)'
          }}>
            {/* モード切替 */}
            <div style={{
              display: 'flex',
              gap: '6px',
              marginBottom: '16px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '10px',
              padding: '4px'
            }}>
              {['japanese', 'latin'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    fontSize: '0.8rem',
                    fontWeight: mode === m ? '600' : '400',
                    background: mode === m 
                      ? 'linear-gradient(135deg, #3b82f6, #f59e0b)' 
                      : 'transparent',
                    color: mode === m ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {m === 'japanese' ? '日本語' : 'English'}
                </button>
              ))}
            </div>

            {/* テキスト入力 */}
            <input
              type="text"
              value={text}
              onChange={(e) => setText(mode === 'latin' ? e.target.value.toUpperCase() : e.target.value)}
              placeholder={mode === 'japanese' ? 'メッセージを入力...' : 'ENTER MESSAGE...'}
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '1.1rem',
                background: 'rgba(5, 5, 15, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#ffffff',
                fontFamily: mode === 'japanese' ? "'Noto Sans JP', sans-serif" : "'JetBrains Mono', monospace",
                letterSpacing: '0.08em',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '12px'
              }}
            />

            {/* モールス出力 */}
            <div style={{
              padding: '14px 16px',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '10px',
              minHeight: '50px'
            }}>
              <div style={{
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.6rem',
                letterSpacing: '0.15em',
                marginBottom: '8px',
                textTransform: 'uppercase'
              }}>
                Morse Output
              </div>
              <div style={{
                background: 'linear-gradient(90deg, #3b82f6, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: '1rem',
                letterSpacing: '0.15em',
                wordBreak: 'break-all',
                lineHeight: '1.7',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: '500'
              }}>
                {morseCode || '---'}
              </div>
            </div>
          </div>

          {/* 右パネル: 再生コントロール */}
          <div style={{
            background: 'rgba(20, 20, 35, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* 光の表示 */}
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: isFlashing 
                ? (currentSignal === '.' 
                  ? 'radial-gradient(circle, #93c5fd 0%, #3b82f6 40%, #1d4ed8 70%, #1e3a8a 100%)'
                  : 'radial-gradient(circle, #fef3c7 0%, #fbbf24 30%, #f59e0b 50%, #d97706 70%, #92400e 100%)')
                : 'radial-gradient(circle, #1f1f2a 0%, #15151f 60%, #0a0a10 100%)',
              boxShadow: isFlashing 
                ? (currentSignal === '.'
                  ? '0 0 50px 20px rgba(59, 130, 246, 0.5), 0 0 100px 40px rgba(59, 130, 246, 0.25), inset 0 0 25px rgba(255, 255, 255, 0.3)'
                  : '0 0 60px 25px rgba(245, 158, 11, 0.6), 0 0 120px 50px rgba(245, 158, 11, 0.3), inset 0 0 30px rgba(255, 255, 255, 0.4)')
                : 'inset 0 0 30px rgba(0,0,0,0.6), 0 0 20px rgba(255, 255, 255, 0.03)',
              border: `3px solid ${isFlashing 
                ? (currentSignal === '.' ? 'rgba(147, 197, 253, 0.6)' : 'rgba(251, 191, 36, 0.6)') 
                : 'rgba(255, 255, 255, 0.1)'}`,
              transition: 'all 0.05s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <span style={{
                fontSize: '2rem',
                color: isFlashing ? '#1a1a1f' : 'rgba(255, 255, 255, 0.2)',
                fontWeight: 'bold'
              }}>
                {currentSignal === '.' ? '●' : currentSignal === '-' ? '━' : '○'}
              </span>
            </div>

            {/* 現在の文字 */}
            <div style={{ 
              minHeight: '60px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              {currentChar ? (
                <>
                  <span style={{
                    fontSize: '2.4rem',
                    background: 'linear-gradient(135deg, #60a5fa, #fbbf24)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}>
                    {currentChar}
                  </span>
                  <span style={{
                    fontSize: '0.9rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    letterSpacing: '0.2em',
                    marginTop: '4px'
                  }}>
                    {currentMorseTable[currentChar]}
                  </span>
                </>
              ) : (
                <span style={{ color: 'rgba(255, 255, 255, 0.25)', fontSize: '0.85rem' }}>
                  Ready to play
                </span>
              )}
            </div>

            {/* 速度スライダー */}
            <div style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px'
            }}>
              <span style={{
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.65rem',
                letterSpacing: '0.1em'
              }}>
                SPEED
              </span>
              <input
                type="range"
                min="50"
                max="300"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                style={{ 
                  flex: 1, 
                  accentColor: '#60a5fa',
                  height: '4px'
                }}
              />
              <span style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.75rem',
                minWidth: '42px'
              }}>
                {speed}ms
              </span>
            </div>

            {/* 再生ボタン */}
            <button
              onClick={isPlaying ? stopMorse : playMorse}
              disabled={!text}
              style={{
                width: '100%',
                padding: '14px 32px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                letterSpacing: '0.2em',
                background: isPlaying 
                  ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                  : 'linear-gradient(135deg, #3b82f6, #f59e0b)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                cursor: text ? 'pointer' : 'not-allowed',
                opacity: text ? 1 : 0.5,
                boxShadow: isPlaying
                  ? '0 4px 20px rgba(220, 38, 38, 0.4)'
                  : '0 4px 25px rgba(59, 130, 246, 0.3), 0 4px 25px rgba(245, 158, 11, 0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              {isPlaying ? '■ STOP' : '▶ PLAY'}
            </button>
          </div>
        </div>

        {/* 放射状樹形図 */}
        <div style={{
          background: 'rgba(15, 15, 25, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '20px',
          padding: '24px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            <h2 style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.75rem',
              letterSpacing: '0.3em',
              fontWeight: '400',
              textTransform: 'uppercase'
            }}>
              Morse Code Tree
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.35)',
              fontSize: '0.65rem',
              marginTop: '4px'
            }}>
              中心から外側へ：
              <span style={{ color: '#60a5fa' }}>青い太点線●●●</span>が短点、
              <span style={{ color: '#fbbf24' }}>オレンジの細線───</span>が長点
            </p>
          </div>
          
          <RadialMorseTree 
            tree={morseTree} 
            highlightPath={highlightPath} 
            isJapanese={mode === 'japanese'} 
          />
        </div>

        {/* フッター */}
        <div style={{
          textAlign: 'center',
          marginTop: '28px',
          fontSize: '0.6rem',
          letterSpacing: '0.3em'
        }}>
          <span style={{ color: '#3b82f6' }}>・・・</span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}> </span>
          <span style={{ color: '#f59e0b' }}>━━━</span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}> </span>
          <span style={{ color: '#3b82f6' }}>・・・</span>
        </div>
      </div>
    </div>
  );
}
