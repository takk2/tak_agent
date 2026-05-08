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

function printBanner() {
  console.log("\n╔════════════════════════════════╗");
  console.log("║     🤖 TAK AI 팀 준비 완료!     ║");
  console.log("║          ⚙️  개발 모드           ║");
  console.log("╚════════════════════════════════╝\n");
  console.log(`📁 작업 경로: ${process.cwd()}`);
  console.log("💡 종료: exit  |  사용량 조회: --usage\n");
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
  console.log('사용법: tak "만들고 싶은 기능"');
  console.log("⚙️  개발 모드:  tak start");
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
};
