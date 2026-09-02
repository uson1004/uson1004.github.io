---
title: "Spring Boot 서버를 Java에서 Kotlin으로 옮기며 배운 것"
date: 2026-09-02T09:30:00+09:00
description: "동작을 유지한 대규모 Java-to-Kotlin 마이그레이션에서 JPA, Querydsl, Jackson, 테스트가 남긴 실제 교훈을 정리합니다."
draft: false
---

기존 Java 기반 Spring Boot 서버를 Kotlin으로 마이그레이션했다. 목표는 새 기능이나 구조 개편이 아니라, **기존 동작과 외부 계약을 유지한 채 언어를 하나로 통일하는 것**이었다.

결과적으로 메인 소스와 테스트에서 Java 파일을 모두 제거했고, Kotlin 기반 Gradle 빌드와 테스트가 정상적으로 동작하는 상태까지 만들었다.

이 글은 단순 문법 변환보다 어려웠던 결정과, 마이그레이션 뒤에 남겨야 할 개선 과제를 기록한 회고다.

## 먼저 정한 원칙: 계약을 바꾸지 않는다

언어를 바꾸는 작업에 기능 변경까지 섞이면 오류의 원인을 분리하기 어려워진다. 그래서 다음 요소는 그대로 유지했다.

- 데이터베이스 테이블과 JPA 매핑
- REST API 요청과 응답 형식
- Querydsl 조회 조건과 정렬 순서
- Spring Security와 JWT 인증 흐름
- Swagger, Bean Validation, JSON 직렬화 규칙
- 기존 테스트가 보장하던 동작

즉, 이번 작업은 Kotlin다운 재설계가 아니라 **안전한 동작 보존 마이그레이션**이었다.

## 한 번에 바꾸지 않고 경계를 나눴다

전체를 한 번에 전환하면 컴파일 오류가 수백 개씩 쌓이고, 어느 변경이 원인인지 판단하기 어려워진다. 다음 경계로 나눠 전환했다.

1. JPA 엔티티와 Repository 계약
2. 인프라 계층: FCM, Outbox, MCP
3. 인증, 공통 설정, Swagger 문서
4. 거래와 리포트 도메인
5. Gradle Kotlin DSL과 Kotlin 플러그인

각 경계는 기존 Java 코드와 가능한 한 1:1 대응되도록 옮기고, 컴파일과 집중 테스트를 통과한 뒤 커밋했다. 이 방식은 문제 범위를 좁히는 데 효과적이었다.

다만 병렬 작업이 같은 Git index를 공유하면서 서로 다른 작업이 하나의 커밋에 섞인 경우도 있었다. 다음에 비슷한 규모의 작업을 한다면 영역별 worktree를 나눠 커밋 경계를 더 엄격하게 관리할 생각이다.

## Kotlin과 JPA가 만나는 지점

Kotlin 클래스는 기본적으로 `final`이지만, JPA는 프록시 생성을 위해 확장 가능한 엔티티가 필요하다. 또한 Hibernate는 no-arg 생성자도 필요로 한다.

그래서 Kotlin 코드만 바꾸는 것으로 끝내지 않고 Gradle 설정을 함께 전환했다.

```kotlin
plugins {
    kotlin("jvm")
    kotlin("plugin.spring")
    kotlin("plugin.jpa")
    kotlin("plugin.allopen")
    kotlin("kapt")
}

allOpen {
    annotation("jakarta.persistence.Entity")
    annotation("jakarta.persistence.MappedSuperclass")
    annotation("jakarta.persistence.Embeddable")
}
```

Kotlin 애너테이션의 대상도 중요했다. Java에서는 필드에 붙던 애너테이션이 Kotlin에서는 생성자 파라미터나 getter에 붙을 수 있다. JPA, Validation, Jackson이 기대하는 위치에 붙도록 `@field:`를 명시했다.

```kotlin
@field:Id
@field:GeneratedValue(strategy = GenerationType.UUID)
var id: UUID? = null
    private set
```

이 부분을 놓치면 컴파일은 성공해도 매핑이나 요청 검증이 의도대로 동작하지 않을 수 있다.

## DTO는 Kotlin의 장점이 가장 잘 드러난 곳이었다

요청 DTO는 Kotlin `data class`와 `val`을 사용해 불변성을 더 명확하게 표현할 수 있었다.

```kotlin
data class CreateTransactionRequest(
    @field:NotNull
    val type: Transaction.TransactionType,

    @field:Positive
    val amount: Long,

    @field:NotBlank
    val title: String,

    @field:NotNull
    val category: Category,
)
```

Lombok getter, builder, 생성자 애너테이션에 의존하지 않아도 되고, 생성 시점에 필요한 값을 코드로 드러낼 수 있다. 특히 API DTO처럼 생성 후 변경되면 안 되는 타입에는 Kotlin이 잘 맞았다.

## 실제로 만난 회귀들

### JSON 키가 달라졌다

Outbox 이벤트를 Kotlin으로 바꾼 뒤 `event_type`이 `eventType`으로 직렬화되는 회귀가 발생했다. 컴파일은 통과했지만 외부 계약은 깨진 상태였다.

필드 애너테이션을 올바른 대상에 적용하고, 실제 직렬화 결과를 검증하는 테스트로 수정했다. 이 경험 이후 DTO와 이벤트 메시지는 단순 단위 테스트만이 아니라 JSON 결과까지 확인해야 한다는 기준이 생겼다.

### Mockito matcher와 nullability

Java Mockito matcher는 Kotlin의 non-null 파라미터와 만날 때 문제가 될 수 있다. matcher가 런타임에 `null`을 반환하는 특성 때문이다.

이 경우 무리하게 matcher를 유지하기보다 `ArgumentCaptor`로 실제 전달된 인자를 검증하는 방식이 더 안전했다. Kotlin 테스트에서는 짧은 mock 코드보다 nullability를 감추지 않는 검증이 중요했다.

### KAPT 캐시 문제

Querydsl 생성 코드는 Kotlin 전환 뒤에도 유지해야 해서 KAPT를 사용했다. 작업 중 증분 컴파일 캐시가 꼬여 코드 오류처럼 보이는 상황이 있었고, Kotlin/KAPT 증분 처리를 끈 재실행으로 캐시 문제와 실제 소스 문제를 분리했다.

빌드 도구 문제를 소스 코드 수정으로 해결하려 하지 않는 것도 중요한 판단이었다.

## 이번 전환으로 얻은 것

- 메인 소스와 테스트의 언어가 Kotlin으로 통일됐다.
- Lombok 의존도가 크게 줄었다.
- DTO와 생성자 의도가 더 명확해졌다.
- `val`, `private set`, nullable type으로 상태 변경과 null 가능성을 드러낼 수 있게 됐다.
- Spring Boot, JPA, Querydsl 기반은 유지하면서 Kotlin 문법을 도입했다.

코드 줄 수는 줄었지만, 그것만으로 품질이 좋아졌다고 판단하지는 않는다. Java 보일러플레이트와 Lombok 코드가 제거된 영향도 크기 때문이다.

## 아직 남은 과제

안전한 전환을 우선했기 때문에 Java 호환 흔적이 일부 남아 있다. 다음 단계는 이를 Kotlin답게 정리하는 작업이다.

- Java 스타일 접근자와 수동 Builder를 제거하고 named argument 또는 팩터리로 전환하기
- 불필요한 `!!`를 줄이기
- 저장 전 식별자처럼 실제로 nullable인 값과, 도메인에서 필수인 값을 구분하기
- 더 이상 사용하지 않는 Lombok Gradle 플러그인과 의존성 제거하기
- Querydsl/KAPT 개선은 별도 작업으로 분리하기

특히 `!!`가 많다면 Kotlin으로 옮겼더라도 null-safety의 장점을 충분히 얻지 못한 상태다. JPA lifecycle 때문에 nullable이 필요한 값과 생성 시점부터 반드시 존재해야 하는 비즈니스 값을 구분하는 것이 다음 개선의 핵심이다.

## 마무리

이번 마이그레이션에서 가장 중요했던 것은 Kotlin 문법을 많이 쓰는 일이 아니라 **기존 계약을 깨지 않는 것**이었다.

Kotlin 전환은 끝이 아니라 시작이다. 먼저 안정적으로 언어를 통일하고, 그다음 Java 호환 계층과 불필요한 nullable, 수동 Builder를 제거해야 Kotlin의 장점이 실제 유지보수성으로 이어진다.
