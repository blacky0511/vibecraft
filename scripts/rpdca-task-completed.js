#!/usr/bin/env node

/**
 * vibecraft TaskCompleted 훅 — RPDCA 자동 전진
 *
 * 서브에이전트의 Task가 완료되면 Task subject에서
 * RPDCA 단계를 감지하고, 다음 단계를 안내한다.
 */

try {
  const hookContext = process.env.HOOK_CONTEXT;
  if (!hookContext) process.exit(0);

  let context;
  try {
    context = JSON.parse(hookContext);
  } catch {
    process.exit(0);
  }

  const subject = context.task_subject || context.taskSubject || '';
  if (!subject) process.exit(0);

  // Task subject에서 RPDCA 단계 감지
  // 예: "[Research] social-login", "[Plan] todo-app", "[Do] payment"
  const phaseMatch = subject.match(/\[(Research|Plan|Do|Check|Act)\]\s*(.*)/i);
  if (!phaseMatch) process.exit(0);

  const phase = phaseMatch[1].toLowerCase();
  const feature = phaseMatch[2].trim();

  // 단계별 다음 행동 안내
  const nextSteps = {
    research: `[vibecraft] ${feature} Research 완료. 다음: writing-plans(opus)로 구현 계획을 작성합니다.`,
    plan: `[vibecraft] ${feature} Plan 완료. 다음: plan-critic(opus)이 계획서를 리뷰합니다.`,
    do: `[vibecraft] ${feature} Do 완료. 다음: gap-detector로 Match Rate를 측정합니다 (Check 단계).`,
    check: `[vibecraft] ${feature} Check 완료. Match Rate 90% 이상이면 완료, 미만이면 Act(자동 수정)로 진입합니다.`,
    act: `[vibecraft] ${feature} Act 완료. gap-detector를 재실행하여 Match Rate를 재측정합니다.`
  };

  const message = nextSteps[phase];
  if (message) {
    console.log(message);
  }

} catch (error) {
  process.exit(0);
}
