---
title: "OCI Ubuntu에 웹 서비스를 배포하는 기본 흐름"
date: 2026-08-31T17:00:00+09:00
description: "OCI Compute, Ubuntu, Nginx, HTTPS를 이용해 작은 웹 서비스를 안전하게 공개하는 실전 배포 순서입니다."
draft: false
---

OCI Compute와 Ubuntu는 작은 API, 관리 도구, Docker 서비스처럼 서버가 필요한 작업에 잘 맞습니다. 반대로 이 블로그처럼 Hugo가 만든 정적 파일만 제공한다면 GitHub Pages가 운영 비용과 관리 부담이 더 적습니다.

이 글은 서버가 필요한 서비스를 OCI Ubuntu에 배포하는 기본 흐름을 설명합니다. 실제 서비스의 포트, 도메인, 배포 방식은 요구사항에 맞게 바꾸면 됩니다.

## 전체 구조

배포 구조는 다음처럼 단순하게 시작하는 것이 좋습니다.

```text
사용자
  ↓ HTTPS 443
OCI Network Security Group
  ↓
Ubuntu 방화벽
  ↓
Nginx
  ↓
정적 파일 또는 애플리케이션 포트
```

OCI 네트워크 규칙과 Ubuntu 내부 방화벽은 둘 다 확인해야 합니다. 한쪽만 열어도 접속이 안 될 수 있습니다.

## 1. Ubuntu 인스턴스 만들기

OCI Console에서 Compute 인스턴스를 만들 때 Ubuntu 이미지를 선택하고 SSH 공개 키를 등록합니다. 로컬에서는 키를 다음처럼 생성할 수 있습니다.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/oci_ubuntu
```

생성된 `~/.ssh/oci_ubuntu.pub` 내용을 OCI에 등록합니다. 인스턴스가 준비된 뒤에는 Ubuntu 이미지의 기본 사용자 `ubuntu`로 연결합니다.

```bash
chmod 600 ~/.ssh/oci_ubuntu
ssh -i ~/.ssh/oci_ubuntu ubuntu@<PUBLIC_IP>
```

개인 키는 Git 저장소나 메신저에 올리지 않습니다.

## 2. 네트워크 규칙 먼저 열기

OCI에서는 Network Security Group(NSG)을 인스턴스 단위로 적용하는 방식이 관리하기 편합니다. 보통 필요한 인바운드 규칙은 다음 세 개입니다.

| 목적 | 프로토콜 | 대상 포트 | 권장 소스 |
|---|---|---:|---|
| 관리용 SSH | TCP | 22 | 내 공인 IP만 |
| HTTP | TCP | 80 | `0.0.0.0/0` |
| HTTPS | TCP | 443 | `0.0.0.0/0` |

SSH를 모든 IP에 열어두는 것은 피하는 편이 좋습니다. OCI는 NSG 또는 Security List와 인스턴스 내부 방화벽을 함께 확인하라고 안내합니다.

## 3. Ubuntu 기본 보안 설정

처음 접속한 뒤 패키지를 최신 상태로 만들고 UFW를 설정합니다.

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y nginx ufw

sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status verbose
```

SSH 포트를 바꾸거나 비밀번호 로그인을 끄려면, 새 SSH 연결이 정상적으로 되는 것을 확인한 뒤 `/etc/ssh/sshd_config`를 조정합니다. 원격 서버에서는 기존 세션을 끊기 전에 새 접속을 한 번 더 테스트하는 습관이 안전합니다.

## 4. 정적 사이트를 Nginx로 제공하기

Hugo 같은 정적 사이트라면 로컬 또는 CI에서 빌드한 `public/` 결과물을 서버에 올립니다.

```bash
rsync -avz --delete public/ ubuntu@<PUBLIC_IP>:/var/www/example/
```

Nginx 설정 파일 `/etc/nginx/sites-available/example`은 다음처럼 시작할 수 있습니다.

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    root /var/www/example;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

활성화한 뒤 설정을 검사하고 다시 읽습니다.

```bash
sudo ln -s /etc/nginx/sites-available/example /etc/nginx/sites-enabled/example
sudo nginx -t
sudo systemctl reload nginx
```

Node, Python, Go 애플리케이션이라면 Nginx는 앞단 프록시가 되고, 애플리케이션은 `systemd`, Docker Compose, 또는 다른 프로세스 관리 도구로 별도 실행합니다. 애플리케이션 포트는 공개하지 않고 Nginx만 80/443을 받게 하는 편이 안전합니다.

## 5. HTTPS 붙이기

도메인의 A 레코드를 OCI 인스턴스 공인 IP로 연결한 뒤, 80번 포트가 외부에서 열려 있는 상태에서 인증서를 발급합니다.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

인증서 자동 갱신은 배포 직후 바로 확인합니다.

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

## 6. 배포 후 확인할 항목

서버와 외부 양쪽에서 확인합니다.

```bash
sudo systemctl status nginx
curl -I http://127.0.0.1
curl -I https://example.com
sudo ufw status verbose
```

다음도 함께 점검하면 좋습니다.

- OCI NSG에서 22, 80, 443만 필요한 범위로 열려 있는지
- Ubuntu에서 SSH 비밀번호 로그인과 root 로그인을 제한했는지
- 운영 로그와 백업 위치를 정했는지
- 도메인, 인증서 만료, 인스턴스 비용·제한을 주기적으로 확인하는지

## GitHub Pages와 OCI 중 무엇을 쓸까

Hugo 블로그, 포트폴리오, 문서처럼 정적 결과물만 필요한 사이트는 GitHub Pages가 기본 선택입니다. 반면 로그인, 데이터베이스, 웹훅, 백그라운드 작업, 사설 API가 필요한 서비스는 OCI Ubuntu 같은 서버가 필요합니다.

두 환경을 함께 쓰는 것도 가능합니다. 예를 들어 공개 블로그는 GitHub Pages에 두고, 별도 API나 관리자 도구만 OCI에 두면 정적 콘텐츠의 단순함과 서버 기능을 함께 가져갈 수 있습니다.

## 참고 자료

- [OCI Linux 인스턴스 연결 가이드](https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/connect-to-linux-instance.htm)
- [OCI Compute 보안 권장 사항](https://docs.oracle.com/en-us/iaas/Content/Security/Reference/compute_security.htm)
- [OCI 네트워크 보안 방식](https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/waystosecure.htm)
