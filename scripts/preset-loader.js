#!/usr/bin/env node

/**
 * vibecraft 프리셋 로더
 * 현재 프로젝트의 기술 스택을 감지하여 적절한 프리셋을 안내한다.
 *
 * 감지 방법:
 * - package.json → Next.js / React / Node.js
 * - build.gradle / pom.xml → Spring Boot / Java
 * - requirements.txt / pyproject.toml → Python
 * - 그 외 → General
 */

const fs = require('fs');
const path = require('path');

function detectPreset() {
  const cwd = process.cwd();
  const results = [];

  // Next.js / React 감지
  const packageJsonPath = path.join(cwd, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps && deps['next']) {
        results.push('preset-nextjs');
      } else if (deps && deps['react']) {
        // React만 있고 Next.js가 없는 경우 (Vite+React, CRA 등)
        results.push('preset-react');
      } else {
        results.push('preset-general');
      }
    } catch (error) {
      console.error(`[vibecraft] package.json 파싱 실패: ${error.message}`);
      results.push('preset-general');
    }
  }

  // Spring Boot / Java 감지
  if (fs.existsSync(path.join(cwd, 'build.gradle')) ||
      fs.existsSync(path.join(cwd, 'build.gradle.kts')) ||
      fs.existsSync(path.join(cwd, 'pom.xml'))) {
    results.push('preset-spring');
  }

  // Python 감지
  if (fs.existsSync(path.join(cwd, 'requirements.txt')) ||
      fs.existsSync(path.join(cwd, 'pyproject.toml')) ||
      fs.existsSync(path.join(cwd, 'setup.py'))) {
    results.push('preset-python');
  }

  if (results.length === 0) {
    results.push('preset-general');
  }

  return [...new Set(results)];
}

try {
  const presets = detectPreset();
  console.log(`감지된 기술 스택 프리셋: ${presets.join(', ')}`);
} catch (error) {
  console.error(`[vibecraft] 프리셋 감지 실패: ${error.message}`);
  console.log('감지된 기술 스택 프리셋: preset-general');
}
