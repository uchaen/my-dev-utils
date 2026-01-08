import React, { useState, useEffect, useRef, useMemo } from 'react';

// 무지개 색상 (들여쓰기 레벨별)
const RAINBOW_COLORS = [
  'rgba(255, 128, 128, 0.15)',  // 빨강
  'rgba(255, 200, 128, 0.15)',  // 주황
  'rgba(255, 255, 128, 0.15)',  // 노랑
  'rgba(128, 255, 128, 0.15)',  // 초록
  'rgba(128, 200, 255, 0.15)',  // 하늘
  'rgba(128, 128, 255, 0.15)',  // 파랑
  'rgba(200, 128, 255, 0.15)',  // 보라
];

function JsonBeautifier() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [indentSize, setIndentSize] = useState(2);
  const [mode, setMode] = useState('beautify');
  const [copied, setCopied] = useState(false);
  const [rainbowIndent, setRainbowIndent] = useState(true);
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  // JSON 구문 강조 및 무지개 들여쓰기
  const highlightedOutput = useMemo(() => {
    if (!output || mode === 'minify') return null;

    const lines = output.split('\n');
    
    return lines.map((line, lineIdx) => {
      // 들여쓰기 레벨 계산
      const leadingSpaces = line.match(/^(\s*)/)[1].length;
      const indentLevel = Math.floor(leadingSpaces / indentSize);
      
      // 들여쓰기 부분과 내용 부분 분리
      const contentPart = line.substring(leadingSpaces);
      
      // 구문 강조 적용
      const highlightedContent = highlightJson(contentPart);
      
      // 무지개 들여쓰기 블록 생성
      const indentBlocks = [];
      for (let i = 0; i < indentLevel; i++) {
        indentBlocks.push(
          <span
            key={i}
            className="json-indent-block"
            style={{ 
              backgroundColor: rainbowIndent ? RAINBOW_COLORS[i % RAINBOW_COLORS.length] : 'transparent',
              width: indentSize + 'ch'
            }}
          >
            {' '.repeat(indentSize)}
          </span>
        );
      }
      
      // 남은 공백 (indentLevel * indentSize 이후의 공백)
      const remainingSpaces = leadingSpaces - (indentLevel * indentSize);
      
      return (
        <div key={lineIdx} className="json-line">
          {indentBlocks}
          {remainingSpaces > 0 && <span>{' '.repeat(remainingSpaces)}</span>}
          {highlightedContent}
        </div>
      );
    });
  }, [output, indentSize, mode, rainbowIndent]);

  // JSON 구문 강조 함수
  function highlightJson(text) {
    if (!text) return null;
    
    const result = [];
    let remaining = text;
    let key = 0;
    
    while (remaining.length > 0) {
      // 키 (따옴표로 시작하고 : 로 끝나는 패턴)
      let match = remaining.match(/^("(?:[^"\\]|\\.)*")\s*:/);
      if (match) {
        result.push(<span key={key++} className="json-key">{match[1]}</span>);
        result.push(<span key={key++} className="json-colon">:</span>);
        remaining = remaining.substring(match[0].length);
        continue;
      }
      
      // 문자열 값
      match = remaining.match(/^("(?:[^"\\]|\\.)*")/);
      if (match) {
        result.push(<span key={key++} className="json-string">{match[1]}</span>);
        remaining = remaining.substring(match[0].length);
        continue;
      }
      
      // 숫자
      match = remaining.match(/^(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/);
      if (match) {
        result.push(<span key={key++} className="json-number">{match[1]}</span>);
        remaining = remaining.substring(match[0].length);
        continue;
      }
      
      // boolean
      match = remaining.match(/^(true|false)/);
      if (match) {
        result.push(<span key={key++} className="json-boolean">{match[1]}</span>);
        remaining = remaining.substring(match[0].length);
        continue;
      }
      
      // null
      match = remaining.match(/^(null)/);
      if (match) {
        result.push(<span key={key++} className="json-null">{match[1]}</span>);
        remaining = remaining.substring(match[0].length);
        continue;
      }
      
      // 괄호
      match = remaining.match(/^([\[\]{}])/);
      if (match) {
        result.push(<span key={key++} className="json-bracket">{match[1]}</span>);
        remaining = remaining.substring(match[0].length);
        continue;
      }
      
      // 콤마
      match = remaining.match(/^(,)/);
      if (match) {
        result.push(<span key={key++} className="json-comma">{match[1]}</span>);
        remaining = remaining.substring(match[0].length);
        continue;
      }
      
      // 공백
      match = remaining.match(/^(\s+)/);
      if (match) {
        result.push(<span key={key++}>{match[1]}</span>);
        remaining = remaining.substring(match[0].length);
        continue;
      }
      
      // 기타
      result.push(<span key={key++}>{remaining[0]}</span>);
      remaining = remaining.substring(1);
    }
    
    return result;
  }

  // 높이 동기화
  const syncHeight = () => {
    const inputEl = inputRef.current;
    const outputEl = outputRef.current;
    
    if (inputEl) {
      inputEl.style.height = 'auto';
    }
    
    const inputHeight = inputEl ? inputEl.scrollHeight : 200;
    const outputHeight = outputEl ? outputEl.scrollHeight : 200;
    const maxHeight = Math.max(200, inputHeight, outputHeight);
    
    if (inputEl) {
      inputEl.style.height = maxHeight + 'px';
    }
  };

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      if (mode === 'beautify') {
        setOutput(JSON.stringify(parsed, null, indentSize));
      } else {
        setOutput(JSON.stringify(parsed));
      }
      setError('');
    } catch (err) {
      setError('JSON 파싱 오류: ' + err.message);
      setOutput('');
    }
  }, [input, indentSize, mode]);

  useEffect(() => {
    syncHeight();
  }, [input, output]);

  const copyToClipboard = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <div className="tool-container tool-container-full">
      <div className="tool-header">
        <h2>JSON Beautifier</h2>
        <p>JSON을 실시간으로 포맷팅하거나 압축합니다.</p>
      </div>

      <div className="tool-grid-start">
        <div className="tool-card tool-card-no-margin">
          <div className="card-header">
            <h3>입력</h3>
            <button className="btn btn-secondary btn-small" onClick={clearAll}>
              초기화
            </button>
          </div>
          <textarea
            ref={inputRef}
            className="input-field output-medium"
            placeholder='{"name":"홍길동","age":30}'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ minHeight: 200, resize: 'none', overflow: 'hidden' }}
          />
        </div>

        <div className="tool-card tool-card-no-margin">
          <div className="card-header">
            <div className="card-header-left">
              <h3>결과</h3>
              <div className="tabs">
                <button
                  className={`tab ${mode === 'beautify' ? 'active' : ''}`}
                  onClick={() => setMode('beautify')}
                >
                  포맷팅
                </button>
                <button
                  className={`tab ${mode === 'minify' ? 'active' : ''}`}
                  onClick={() => setMode('minify')}
                >
                  압축
                </button>
              </div>
              {mode === 'beautify' && (
                <div className="tabs">
                  {[2, 4, 8].map((size) => (
                    <button
                      key={size}
                      className={`tab ${indentSize === size ? 'active' : ''}`}
                      onClick={() => setIndentSize(size)}
                    >
                      {size}칸
                    </button>
                  ))}
                </div>
              )}
            </div>
            {output && (
              <div className="btn-group">
                {mode === 'beautify' && (
                  <button
                    className={`rainbow-toggle ${rainbowIndent ? 'active' : ''}`}
                    onClick={() => setRainbowIndent(!rainbowIndent)}
                    title="무지개 들여쓰기"
                  >
                    <span className="rainbow-toggle-thumb" />
                  </button>
                )}
                <button className="btn btn-secondary btn-small" onClick={copyToClipboard}>
                  {copied ? '✓' : '복사'}
                </button>
              </div>
            )}
          </div>
          {error ? (
            <div className="output-area error output-medium">
              {error}
            </div>
          ) : output ? (
            <div
              ref={outputRef}
              className="json-output output-medium"
            >
              {mode === 'beautify' ? highlightedOutput : output}
            </div>
          ) : (
            <div className="json-output json-placeholder output-medium">
              유효한 JSON을 입력하면 여기에 결과가 표시됩니다.
            </div>
          )}
        </div>
      </div>

      {input && output && (
        <div className="tool-card mt-16">
          <h3>통계</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{input.length.toLocaleString()}</div>
              <div className="stat-label">원본 (전체 글자수)</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{output.length.toLocaleString()}</div>
              <div className="stat-label">결과 (전체 글자수)</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {(() => {
                  try {
                    return Object.keys(JSON.parse(input)).length;
                  } catch {
                    return 0;
                  }
                })()}
              </div>
              <div className="stat-label">최상위 키 수</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JsonBeautifier;
