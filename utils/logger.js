function divider() {
  console.log("─".repeat(50));
}

function printRunStart(userRequest) {
  console.log("\n🚀 AI 팀 시작!\n");
  console.log(`📌 요청: ${userRequest}\n`);
  divider();
}

function printFileStart() {
  console.log("\n📁 파일 생성 중...\n");
}

function printComplete(outputDir, fileCount) {
  console.log("\n🎉 완료!");
  console.log(`📁 결과물 위치: ${outputDir}`);
  console.log(`📄 생성된 파일: ${fileCount}개`);
}

function printError(message) {
  console.error(`\n❌ 에러 발생: ${message}`);
  console.log("⚠️  에러 이전까지 진행된 내용의 비용을 출력합니다.");
}

function printBanner(detected = []) {
  console.log("\n╔════════════════════════════════╗");
  console.log("║     🤖 TAK AI 팀 준비 완료!     ║");
  console.log("║          ⚙️  개발 모드           ║");
  console.log("╚════════════════════════════════╝\n");
  console.log(`📁 작업 경로: ${process.cwd()}`);
  if (detected.length > 0) {
    console.log(`🔍 프로젝트 감지: ${detected.join(", ")}`);
  }
  console.log("💡 종료: exit  |  사용량 조회: --usage\n");
}

function printInitBanner(configPath) {
  console.log("\n╔════════════════════════════════╗");
  console.log("║       🔧 TAK 초기 설정          ║");
  console.log("╚════════════════════════════════╝\n");
  console.log(`📁 설정 파일: ${configPath}\n`);
}

function printInitDone(configPath) {
  console.log("✅ 설정이 저장되었습니다!");
  console.log(`📁 ${configPath}`);
  console.log("💡 이제 어느 프로젝트에서든 tak dev 로 실행하세요.\n");
}

function printNoConfig() {
  console.log("\n⚠️  API 키가 설정되지 않았습니다.");
  console.log("💡 tak init 을 실행해서 최초 설정을 완료해주세요.\n");
}

function printChatBanner() {
  console.log("\n╔════════════════════════════════╗");
  console.log("║     🤖 TAK AI 팀 준비 완료!     ║");
  console.log("║          💬 대화 모드            ║");
  console.log("╚════════════════════════════════╝\n");
  console.log("💡 종료: exit  |  사용량 조회: --usage\n");
}

function printExit() {
  console.log("\n👋 TAK 종료!");
}

function printHelp() {
  console.log("🔧 초기 설정:   tak init");
  console.log("⚙️  개발 모드:  tak dev");
  console.log("💬 대화 모드:  tak chat");
  console.log("📊 사용량 조회: tak --usage");
}

function printChatResponse(response) {
  console.log(`\n🤖 ${response}\n`);
}

module.exports = {
  divider,
  printRunStart,
  printFileStart,
  printComplete,
  printError,
  printBanner,
  printChatBanner,
  printExit,
  printHelp,
  printChatResponse,
  printInitBanner,
  printInitDone,
  printNoConfig,
};
