export default function AlertPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">텔레그램 알림 설정</h1>
        <p className="text-gray-400">
          김치프리미엄이 설정한 임계값을 넘으면 텔레그램으로 알림을 받을 수 있습니다.
        </p>
      </div>

      {/* 봇 연동 안내 */}
      <section className="rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">1. 봇 추가하기</h2>
        <ol className="list-decimal list-inside text-gray-300 space-y-2 text-sm">
          <li>텔레그램에서 <code className="text-green-400 bg-gray-800 px-1.5 py-0.5 rounded">@KimchiPremiumBot</code>을 검색합니다.</li>
          <li><code className="text-green-400 bg-gray-800 px-1.5 py-0.5 rounded">/start</code>를 입력해 봇을 시작합니다.</li>
          <li>봇이 사용법을 안내해줍니다.</li>
        </ol>
      </section>

      {/* 알림 설정 방법 */}
      <section className="rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">2. 알림 설정하기</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
            <code className="text-green-400 shrink-0">/alert 3.0</code>
            <span className="text-gray-300">김프가 3.0% 이상이면 알림을 받습니다.</span>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
            <code className="text-green-400 shrink-0">/alert 5.0</code>
            <span className="text-gray-300">김프가 5.0% 이상이면 알림을 받습니다.</span>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
            <code className="text-green-400 shrink-0">/alert off</code>
            <span className="text-gray-300">알림을 해제합니다.</span>
          </div>
        </div>
      </section>

      {/* 기타 명령어 */}
      <section className="rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">3. 기타 명령어</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
            <code className="text-green-400 shrink-0">/kimp</code>
            <span className="text-gray-300">현재 김프를 즉시 조회합니다.</span>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
            <code className="text-green-400 shrink-0">/status</code>
            <span className="text-gray-300">내 알림 설정 현황을 확인합니다.</span>
          </div>
        </div>
      </section>

      {/* 알림 동작 설명 */}
      <section className="rounded-2xl bg-gray-900 border border-gray-800 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-white">알림은 어떻게 동작하나요?</h2>
        <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm">
          <li>서버에서 1분마다 김프를 체크합니다.</li>
          <li>김프가 설정한 임계값 이상이면 텔레그램 메시지를 보냅니다.</li>
          <li>음수 김프(역프)도 절대값 기준으로 알림이 동작합니다.</li>
        </ul>
      </section>
    </div>
  );
}
