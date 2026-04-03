#!/usr/bin/env node

/**
 * vibecraft PreCompact 훅 — RPDCA 맥락 보존
 *
 * compact 발생 시 진행 중인 RPDCA 상태를 요약하여
 * additionalContext로 주입한다. compact 후에도 AI가
 * 현재 작업 맥락을 복원할 수 있게 한다.
 */

const fs = require('fs');
const path = require('path');

try {
  // docs/plans/ 스캔하여 진행 중인 feature 탐지
  const plansDir = path.resolve('docs/plans');
  const features = [];

  if (fs.existsSync(plansDir)) {
    const entries = fs.readdirSync(plansDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === 'archive') continue;

      const featureDir = path.join(plansDir, entry.name);
      const hasResearch = fs.existsSync(path.join(featureDir, 'research.md'));
      const hasPlan = fs.existsSync(path.join(featureDir, 'plan.md'));
      const hasPlanReview = fs.existsSync(path.join(featureDir, 'plan-review.md'));
      const hasDesign = fs.existsSync(path.join(featureDir, 'design.md'));

      // RPDCA 단계 추정
      let stage = 'unknown';
      if (hasPlan && hasPlanReview) {
        stage = 'Do (실행 중 또는 Check 대기)';
      } else if (hasPlan) {
        stage = 'Plan (plan-critic 리뷰 대기)';
      } else if (hasDesign) {
        stage = 'Plan (설계 완료, writing-plans 대기)';
      } else if (hasResearch) {
        stage = 'Research (리서치 완료, 설계 대기)';
      } else {
        stage = 'Research (시작 전)';
      }

      features.push({
        name: entry.name,
        stage,
        files: { hasResearch, hasPlan, hasPlanReview, hasDesign }
      });
    }
  }

  if (features.length === 0) {
    // 진행 중인 작업 없음 — 주입할 맥락 없음
    process.exit(0);
  }

  // additionalContext로 RPDCA 상태 요약 주입
  const summary = features.map(f => `- ${f.name}: ${f.stage}`).join('\n');

  const context = [
    '[vibecraft RPDCA 상태 — compact 전 스냅샷]',
    `진행 중인 작업 ${features.length}개:`,
    summary,
    '',
    '모델 배정: research=sonnet, plan=opus, plan-critic=opus, do=sonnet, gap-detector=opus',
    '관련 파일: docs/plans/{feature}/ 하위 참조'
  ].join('\n');

  console.log(context);

} catch (error) {
  // 훅 실패 시 조용히 종료 (compact를 방해하면 안 됨)
  process.exit(0);
}
