---
title: "Hugo로 시작하는 정적 블로그"
date: 2026-08-31T16:00:00+09:00
description: "Markdown을 Git으로 관리하고 GitHub Pages에 안전하게 배포하는 가장 단순한 흐름입니다."
draft: false
---

이 블로그의 글은 브라우저 저장소가 아니라 Git 저장소의 Markdown 파일로 관리합니다.

## 글을 쓰는 흐름

새 글은 `content/posts/`에 Markdown 파일로 작성합니다. 제목, 날짜, 설명은 머리말에 넣고 본문은 Markdown으로 작성합니다.

### 발행 기준

`main` 브랜치에 커밋하고 푸시한 Markdown만 공개 사이트에 반영됩니다. 이것이 여러 기기와 방문자가 같은 글을 읽을 수 있게 만드는 기준입니다.

- Markdown 파일 작성
- 로컬에서 Hugo로 미리보기
- Git 커밋과 푸시
- GitHub Actions가 빌드와 배포

## 글 목록은 어떻게 만들어지나

Hugo는 각 Markdown 파일의 제목, 날짜, 설명을 읽어 홈과 글 목록의 가로 행으로 렌더링합니다. 본문은 별도 글 페이지로 변환됩니다.

> 정적 블로그는 읽는 페이지를 미리 만들어 배포합니다. 방문자가 접근할 때 데이터베이스를 조회하지 않습니다.

## 코드 예시

```bash
hugo new content posts/my-new-post.md
hugo server -D
git add content/posts/my-new-post.md
git commit -m "docs(posts): add my new post"
git push origin main
```

## 다음 단계

글을 작성한 뒤 `hugo --gc --minify`로 빌드가 성공하는지 확인하면 됩니다.
