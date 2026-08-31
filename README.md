# write.

Git으로 관리하고 Hugo로 빌드하는 개인 정적 블로그입니다. 글을 브라우저에서 출간하지 않습니다. `main` 브랜치에 커밋하고 푸시한 Markdown 파일만 GitHub Pages에 공개됩니다.

## 준비

macOS에서는 다음 명령으로 Hugo를 설치합니다.

```bash
brew install hugo
hugo version
```

이 프로젝트는 Hugo `0.165.0`을 기준으로 작성했습니다.

## 글 작성부터 배포까지

1. 새 글을 만듭니다.

   ```bash
   hugo new content posts/<slug>.md
   ```

2. 생성된 파일의 머리말을 채웁니다.

   ```yaml
   ---
   title: "글 제목"
   date: 2026-08-31T16:00:00+09:00
   description: "홈의 가로 글 목록에 보일 짧은 소개"
   draft: false
   ---
   ```

3. 초안을 포함해 로컬에서 확인합니다.

   ```bash
   hugo server -D
   ```

4. 배포 전 정적 결과물을 만듭니다.

   ```bash
   hugo --gc --minify
   ```

5. 확인한 Markdown만 커밋하고 푸시합니다.

   ```bash
   git add content/posts/<slug>.md
   git commit -m "docs(posts): add <slug>"
   git push origin main
   ```

`draft: true`인 글은 기본 프로덕션 빌드에 포함되지 않습니다. 파일명은 URL의 일부가 되므로 이미 공개한 글은 파일명을 바꾸지 않는 편이 안전합니다.

작성 가이드: [GitHub 저장소](https://github.com/uson1004/uson1004.github.io)

## 기존 브라우저 데이터

이전 정적 편집기는 브라우저 안에만 데이터를 저장했습니다. 배포 전에는 필요한 값을 브라우저 개발자 도구 Console에서 복사해 보관하세요. 이 배포는 아래 키를 읽거나 삭제하지 않습니다.

```js
localStorage.getItem("write.draft.v2")
localStorage.getItem("write.published.v2")
localStorage.getItem("write.draft.v1")
localStorage.getItem("write.posts.v1")
```

복사한 JSON의 `title`, `content`, `publishedAt` 값을 새 Markdown 파일의 `title`, 본문, `date`로 옮기면 됩니다. JSON이 손상되어 읽히지 않으면 원본 문자열 자체를 보관한 뒤 수동으로 복원하세요.

## 배포

`main`에 푸시하면 GitHub Actions가 Hugo 결과물만 GitHub Pages에 배포합니다. GitHub 저장소의 **Settings → Pages → Build and deployment → Source**는 **GitHub Actions**로 설정해야 합니다.
