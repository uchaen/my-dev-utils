# 개발 및 배포 순서

### Step 1: 프로젝트 생성

```bash
npx create-react-app my-dev-utils
cd my-dev-utils
npm install jwt-decode crypto-js
npm install gh-pages --save-dev
```



### Step 2: GitHub Pages 배포 설정
**package.json 수정**
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  },
  "homepage": "https://uchaen.github.io/my-dev-utils/"
}
```


### Step 3: 배포 실행
`npm run deploy`