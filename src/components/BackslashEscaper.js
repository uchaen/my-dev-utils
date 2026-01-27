import React, { useState, useEffect } from 'react';

function BackslashEscaper() {
  const [input, setInput] = useState(() => {
    const saved = sessionStorage.getItem('backslash-escaper-input');
    return saved || '';
  });
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState(() => {
    const saved = sessionStorage.getItem('backslash-escaper-mode');
    return saved || 'escape';
  });
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Escape 함수: 특수문자를 이스케이프 시퀀스로 변환
  const escapeString = (str) => {
    return str
      .replace(/\\/g, '\\\\')     // 백슬래시
      .replace(/"/g, '\\"')        // 큰따옴표
      .replace(/'/g, "\\'")        // 작은따옴표
      .replace(/\n/g, '\\n')       // 줄바꿈
      .replace(/\r/g, '\\r')       // 캐리지 리턴
      .replace(/\t/g, '\\t');      // 탭
  };

  // Unescape 함수: 이스케이프 시퀀스를 원래 문자로 변환
  const unescapeString = (str) => {
    try {
      let result = '';
      let i = 0;
      
      while (i < str.length) {
        if (str[i] === '\\' && i + 1 < str.length) {
          const nextChar = str[i + 1];
          switch (nextChar) {
            case '\\':
              result += '\\';
              i += 2;
              break;
            case '"':
              result += '"';
              i += 2;
              break;
            case "'":
              result += "'";
              i += 2;
              break;
            case 'n':
              result += '\n';
              i += 2;
              break;
            case 'r':
              result += '\r';
              i += 2;
              break;
            case 't':
              result += '\t';
              i += 2;
              break;
            default:
              result += str[i];
              i++;
          }
        } else {
          result += str[i];
          i++;
        }
      }
      
      return result;
    } catch (err) {
      throw new Error('유효하지 않은 이스케이프 시퀀스가 포함되어 있습니다.');
    }
  };

  useEffect(() => {
    if (!input) {
      setOutput('');
      setError('');
      return;
    }

    try {
      if (mode === 'escape') {
        setOutput(escapeString(input));
        setError('');
      } else {
        setOutput(unescapeString(input));
        setError('');
      }
    } catch (err) {
      setError(err.message);
      setOutput('');
    }
  }, [input, mode]);

  // sessionStorage에 저장
  useEffect(() => {
    if (input) {
      sessionStorage.setItem('backslash-escaper-input', input);
    } else {
      sessionStorage.removeItem('backslash-escaper-input');
    }
  }, [input]);

  useEffect(() => {
    sessionStorage.setItem('backslash-escaper-mode', mode);
  }, [mode]);

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
    sessionStorage.removeItem('backslash-escaper-input');
  };

  const swapInputOutput = () => {
    if (output) {
      setInput(output);
      // 모드도 반대로 전환
      setMode(mode === 'escape' ? 'unescape' : 'escape');
    }
  };

  return (
    <div className="tool-container tool-container-full">
      <div className="tool-header">
        <h2>Backslash Escape/Unescape</h2>
        <p>이스케이프 시퀀스(\, ", ', \n, \t, \r 등)를 특수문자로 변환하거나 복원합니다.</p>
      </div>

      <div className="tool-grid">
        <div className="tool-card tool-card-no-margin">
          <div className="card-header">
            <div className="card-header-left">
              <h3>입력</h3>
              <div className="tabs">
                <button 
                  className={`tab ${mode === 'escape' ? 'active' : ''}`}
                  onClick={() => setMode('escape')}
                >
                  Escape
                </button>
                <button 
                  className={`tab ${mode === 'unescape' ? 'active' : ''}`}
                  onClick={() => setMode('unescape')}
                >
                  Unescape
                </button>
              </div>
            </div>
            <div className="btn-group">
              {output && (
                <button 
                  className="btn btn-secondary btn-small" 
                  onClick={swapInputOutput}
                  title="입력/출력 교환"
                >
                  ⇄
                </button>
              )}
              <button className="btn btn-secondary btn-small" onClick={clearAll}>
                초기화
              </button>
            </div>
          </div>
          <textarea
            className="input-field textarea-large"
            placeholder={mode === 'escape' 
              ? '이스케이프할 텍스트를 입력하세요...\n예: Hello "World"\nNew line here'
              : '언이스케이프할 텍스트를 입력하세요...\n예: Hello \\"World\\"\\nNew line here'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        <div className="tool-card tool-card-no-margin">
          <div className="card-header">
            <h3>결과 ({mode === 'escape' ? 'Escaped' : 'Unescaped'})</h3>
            {output && (
              <button className="btn btn-secondary btn-small" onClick={copyToClipboard}>
                {copied ? '✓' : '복사'}
              </button>
            )}
          </div>
          {error ? (
            <div className="output-area error output-large">
              {error}
            </div>
          ) : output ? (
            <div className="output-area success output-large" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {output}
            </div>
          ) : (
            <div className="output-area output-large output-placeholder">
              {mode === 'escape' 
                ? '텍스트를 입력하면 이스케이프된 결과가 표시됩니다.'
                : '이스케이프된 텍스트를 입력하면 원본 텍스트가 표시됩니다.'
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BackslashEscaper;
