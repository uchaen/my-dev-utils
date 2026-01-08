import React, { useState, useMemo, useRef, useEffect } from 'react';

// 간단한 문자 단위 diff 계산 (LCS 기반)
function computeCharDiff(oldStr, newStr) {
  if (oldStr === newStr) return [{ type: 'same', text: newStr }];
  if (!oldStr) return [{ type: 'added', text: newStr }];
  if (!newStr) return [{ type: 'removed', text: oldStr }];

  const m = oldStr.length;
  const n = newStr.length;
  
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldStr[i - 1] === newStr[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result = [];
  let i = m, j = n;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldStr[i - 1] === newStr[j - 1]) {
      result.unshift({ type: 'same', text: oldStr[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', text: newStr[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'removed', text: oldStr[i - 1] });
      i--;
    }
  }

  // 연속된 같은 타입 병합
  const merged = [];
  for (const item of result) {
    if (merged.length > 0 && merged[merged.length - 1].type === item.type) {
      merged[merged.length - 1].text += item.text;
    } else {
      merged.push({ ...item });
    }
  }

  return merged;
}

// 줄 단위 LCS diff 계산
function computeLineDiff(leftLines, rightLines) {
  const m = leftLines.length;
  const n = rightLines.length;
  
  // LCS 테이블 생성
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (leftLines[i - 1] === rightLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 역추적하여 diff 생성
  const result = [];
  let i = m, j = n;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && leftLines[i - 1] === rightLines[j - 1]) {
      result.unshift({ type: 'same', left: leftLines[i - 1], right: rightLines[j - 1], charDiff: null });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', left: '', right: rightLines[j - 1], charDiff: null });
      j--;
    } else {
      result.unshift({ type: 'removed', left: leftLines[i - 1], right: '', charDiff: null });
      i--;
    }
  }

  // 인접한 removed + added를 modified로 병합
  const merged = [];
  for (let k = 0; k < result.length; k++) {
    const curr = result[k];
    const next = result[k + 1];
    
    if (curr.type === 'removed' && next && next.type === 'added') {
      // 문자 단위 diff 계산
      const charDiff = computeCharDiff(curr.left, next.right);
      merged.push({ type: 'modified', left: curr.left, right: next.right, charDiff });
      k++; // next 건너뛰기
    } else {
      merged.push(curr);
    }
  }

  return merged;
}

function DiffTool() {
  const [left, setLeft] = useState(() => {
    const saved = sessionStorage.getItem('diff-left');
    return saved || '';
  });
  const [right, setRight] = useState(() => {
    const saved = sessionStorage.getItem('diff-right');
    return saved || '';
  });
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const leftEditorRef = useRef(null);
  const rightEditorRef = useRef(null);

  const diff = useMemo(() => {
    const leftLines = left.split('\n');
    const rightLines = right.split('\n');
    return computeLineDiff(leftLines, rightLines);
  }, [left, right]);

  // 양쪽 높이 동기화 (둘 다 div)
  useEffect(() => {
    const leftEl = leftEditorRef.current;
    const rightEl = rightEditorRef.current;
    
    if (!leftEl || !rightEl) return;

    // 둘 다 auto로 설정해서 실제 콘텐츠 높이 측정
    leftEl.style.height = 'auto';
    rightEl.style.height = 'auto';
    
    const leftHeight = leftEl.scrollHeight;
    const rightHeight = rightEl.scrollHeight;
    
    // 둘 중 큰 값으로 통일
    const maxHeight = Math.max(200, leftHeight, rightHeight);
    
    leftEl.style.height = maxHeight + 'px';
    rightEl.style.height = maxHeight + 'px';
    
    // highlight layer 높이도 동기화
    const rightHighlightLayer = rightEl.querySelector('.diff-highlight-layer');
    if (rightHighlightLayer) {
      rightHighlightLayer.style.height = maxHeight + 'px';
    }
  }, [left, right, diff]);

  // sessionStorage에 저장
  useEffect(() => {
    if (left) {
      sessionStorage.setItem('diff-left', left);
    } else {
      sessionStorage.removeItem('diff-left');
    }
  }, [left]);

  useEffect(() => {
    if (right) {
      sessionStorage.setItem('diff-right', right);
    } else {
      sessionStorage.removeItem('diff-right');
    }
  }, [right]);

  const [copiedKey, setCopiedKey] = useState('');

  const clearLeft = () => {
    setLeft('');
    if (leftRef.current) {
      leftRef.current.innerText = '';
    }
    sessionStorage.removeItem('diff-left');
  };

  const clearRight = () => {
    setRight('');
    if (rightRef.current) {
      rightRef.current.innerText = '';
    }
    sessionStorage.removeItem('diff-right');
  };

  const copyLeft = () => {
    if (left) {
      navigator.clipboard.writeText(left);
      setCopiedKey('left');
      setTimeout(() => setCopiedKey(''), 1500);
    }
  };

  const copyRight = () => {
    if (right) {
      navigator.clipboard.writeText(right);
      setCopiedKey('right');
      setTimeout(() => setCopiedKey(''), 1500);
    }
  };

  // contentEditable에서 텍스트 추출
  const handleLeftInput = () => {
    if (leftRef.current) {
      const text = leftRef.current.innerText;
      setLeft(text);
    }
  };

  const handleRightInput = () => {
    if (rightRef.current) {
      const text = rightRef.current.innerText;
      setRight(text);
    }
  };

  // left 값이 외부에서 변경되었을 때 (초기화, sessionStorage 복원 등)
  useEffect(() => {
    if (leftRef.current) {
      if (left === '' && leftRef.current.innerText !== '') {
        leftRef.current.innerText = '';
      } else if (left !== '' && leftRef.current.innerText !== left) {
        // sessionStorage에서 복원된 값 설정
        leftRef.current.innerText = left;
      }
    }
  }, [left]);

  // right 값이 외부에서 변경되었을 때 (초기화, sessionStorage 복원 등)
  useEffect(() => {
    if (rightRef.current) {
      if (right === '' && rightRef.current.innerText !== '') {
        rightRef.current.innerText = '';
      } else if (right !== '' && rightRef.current.innerText !== right) {
        // sessionStorage에서 복원된 값 설정
        rightRef.current.innerText = right;
      }
    }
  }, [right]);

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleDrop = (e) => {
    e.preventDefault();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '  ');
    }
  };

  const renderHighlightLine = (d, idx) => {
    if (d.type === 'same') {
      return <div key={idx} className="diff-highlight-line">{d.right || '\u00A0'}</div>;
    }
    
    if (d.type === 'added') {
      return (
        <div key={idx} className="diff-highlight-line diff-line-added">
          {d.right || '\u00A0'}
        </div>
      );
    }
    
    if (d.type === 'removed') {
      return (
        <div key={idx} className="diff-highlight-line diff-line-removed">
          <span className="diff-removed-text">{d.left}</span>
        </div>
      );
    }
    
    // modified - 문자 단위로 하이라이트
    if (d.charDiff) {
      return (
        <div key={idx} className="diff-highlight-line diff-line-modified">
          {d.charDiff.map((part, partIdx) => {
            if (part.type === 'same') {
              return <span key={partIdx}>{part.text}</span>;
            } else if (part.type === 'added') {
              return <span key={partIdx} className="diff-char-added">{part.text}</span>;
            } else if (part.type === 'removed') {
              return <span key={partIdx} className="diff-char-removed">{part.text}</span>;
            }
            return null;
          })}
        </div>
      );
    }
    
    return <div key={idx} className="diff-highlight-line">{d.right || '\u00A0'}</div>;
  };

  return (
    <div className="tool-container tool-container-full">
      <div className="tool-header">
        <h2>Text Diff 비교</h2>
        <p>두 텍스트의 차이점을 문자 단위로 실시간 비교합니다.</p>
      </div>

      <div className="diff-container">
        <div className="tool-card diff-card">
          <div className="card-header">
            <h3>원본</h3>
            <div className="btn-group">
              <button className="btn btn-secondary btn-small" onClick={copyLeft}>
                {copiedKey === 'left' ? '✓' : '복사'}
              </button>
              <button className="btn btn-secondary btn-small" onClick={clearLeft}>
                초기화
              </button>
            </div>
          </div>
          <div ref={leftEditorRef} className="diff-editor">
            <div
              ref={leftRef}
              className="diff-input-layer"
              contentEditable
              onInput={handleLeftInput}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onDrop={handleDrop}
              suppressContentEditableWarning
              data-placeholder="원본 텍스트를 입력하세요..."
            />
          </div>
        </div>

        <div className="tool-card diff-card">
          <div className="card-header">
            <h3>비교</h3>
            <div className="btn-group">
              <button className="btn btn-secondary btn-small" onClick={copyRight}>
                {copiedKey === 'right' ? '✓' : '복사'}
              </button>
              <button className="btn btn-secondary btn-small" onClick={clearRight}>
                초기화
              </button>
            </div>
          </div>
          <div ref={rightEditorRef} className="diff-editor">
            {/* 하이라이트 레이어 */}
            <div className="diff-highlight-layer">
              {diff.map((d, idx) => renderHighlightLine(d, idx))}
            </div>
            {/* 입력 레이어 */}
            <div
              ref={rightRef}
              className="diff-input-layer"
              contentEditable
              onInput={handleRightInput}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onDrop={handleDrop}
              suppressContentEditableWarning
              data-placeholder="비교할 텍스트를 입력하세요..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiffTool;
