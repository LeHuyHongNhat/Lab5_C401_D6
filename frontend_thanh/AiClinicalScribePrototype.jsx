import React, { useEffect, useMemo, useState } from 'react';

const FIELD_LABELS = {
  subjective: 'S - Subjective',
  objective: 'O - Objective',
  assessment: 'A - Assessment',
  plan: 'P - Plan',
};

const SCENARIOS = {
  happy: {
    key: 'happy',
    name: '1. Happy Path',
    tag: 'AI đúng, tự tin cao',
    description:
      'SOAP, chỉ định và toa thuốc đã đầy đủ. Bác sĩ chỉ cần duyệt nhanh từng trường rồi lưu vào EHR.',
    alertTone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    alertText: 'Bản nháp đầy đủ, phù hợp để duyệt nhanh',
    visit: {
      patient: 'Nguyễn Thị Lan, 42 tuổi',
      doctor: 'BS. Trần Minh Khôi',
      department: 'Nội tổng quát Vinmec Times City',
      reason: 'Ho khan, sốt nhẹ, đau họng 3 ngày',
    },
    banners: [],
    soap: {
      subjective:
        'Bệnh nhân nữ 42 tuổi, than phiền ho khan, đau họng, sốt nhẹ 37,8°C trong 3 ngày. Không khó thở, không đau ngực. Đã tự dùng paracetamol tại nhà, đáp ứng một phần.',
      objective:
        'Tỉnh táo, tiếp xúc tốt. Mạch 86 lần/phút, huyết áp 118/76 mmHg, SpO2 98%, nhiệt độ 37,8°C. Họng sung huyết nhẹ, phổi thông khí tốt, chưa ghi nhận ran.',
      assessment: 'Viêm đường hô hấp trên cấp, chưa ghi nhận dấu hiệu nhiễm khuẩn nặng.',
      plan:
        'Điều trị triệu chứng, nghỉ ngơi, uống nhiều nước ấm. Theo dõi nếu sốt cao kéo dài hoặc xuất hiện khó thở. Hẹn tái khám nếu không cải thiện sau 3 ngày.',
    },
    orders: ['Đo nhiệt độ và SpO2 tại phòng khám', 'Tư vấn chăm sóc tại nhà và dấu hiệu cần tái khám'],
    prescriptions: [
      'Paracetamol 500mg: 1 viên khi sốt trên 38,5°C, cách tối thiểu 6 giờ, tối đa 4 viên/ngày',
      'Alpha chymotrypsin 4,2mg: 2 viên/ngày, chia 2 lần',
      'Nước súc họng Benzydamine: dùng 3 lần/ngày sau ăn',
    ],
  },
  low: {
    key: 'low',
    name: '2. Low-confidence Path',
    tag: 'Có vùng nghe không chắc',
    description:
      'Một số thuật ngữ được AI đánh dấu mơ hồ. Bác sĩ có thể chấp nhận, sửa, hoặc từ chối từng mục để tạo learning signal rõ ràng.',
    alertTone: 'border-amber-200 bg-amber-50 text-amber-700',
    alertText: 'Có vùng độ tin cậy thấp, cần bác sĩ xác nhận',
    visit: {
      patient: 'Lê Văn Hùng, 57 tuổi',
      doctor: 'BS. Phạm Quỳnh Anh',
      department: 'Tim mạch Vinmec Central Park',
      reason: 'Đau ngực trái thoáng qua, hồi hộp, mệt khi gắng sức',
    },
    banners: [
      {
        tone: 'border-amber-200 bg-amber-50 text-amber-900',
        text: 'AI đã đánh dấu các cụm nghe chưa chắc bằng ký hiệu (??). Bác sĩ nên ưu tiên rà soát trước khi duyệt.',
      },
    ],
    soap: {
      subjective:
        'Bệnh nhân nam 57 tuổi, đau tức ngực trái từng cơn khoảng 2 tuần, tăng khi leo cầu thang. Có cảm giác hồi hộp và khó thở mức độ nhẹ khi gắng sức. Tiền sử tăng huyết áp, đang dùng thuốc (??) mỗi sáng.',
      objective:
        'Mạch 92 lần/phút, huyết áp 146/88 mmHg, nhịp tim đều. Điện tim tại phòng khám ghi nhận (??) ST chênh xuống nhẹ ở chuyển đạo trước tim. Chưa ghi nhận phù ngoại biên.',
      assessment:
        'Theo dõi đau thắt ngực ổn định và tăng huyết áp chưa kiểm soát tối ưu. Cần loại trừ thiếu máu cơ tim (??).',
      plan:
        'Đề nghị làm điện tim 12 chuyển đạo, xét nghiệm men tim nếu triệu chứng tái phát, và tối ưu thuốc hạ áp. Bác sĩ cần xác nhận lại tên thuốc nền bệnh nhân đang dùng.',
    },
    orders: ['Điện tim 12 chuyển đạo', 'Đo huyết áp lặp lại sau nghỉ 10 phút', 'Xét nghiệm Troponin nếu đau ngực tái phát'],
    prescriptions: ['Amlodipine 5mg: 1 viên sáng', 'Nitroglycerin ngậm dưới lưỡi khi đau ngực nếu không tụt huyết áp'],
  },
  failure: {
    key: 'failure',
    name: '3. Failure Path',
    tag: 'AI bỏ sót và chẩn đoán sai',
    description:
      'AI bỏ sót dị ứng thuốc và gợi ý chẩn đoán chưa đúng. Form cho phép bác sĩ xóa, nhập lại từ đầu hoặc sửa từng mục rất nhanh.',
    alertTone: 'border-rose-200 bg-rose-50 text-rose-700',
    alertText: 'Phát hiện nội dung cần sửa trước khi lưu',
    visit: {
      patient: 'Trần Quốc Bảo, 8 tuổi',
      doctor: 'BS. Nguyễn Thu Hà',
      department: 'Nhi khoa Vinmec Smart City',
      reason: 'Sốt, ho, sổ mũi, ăn kém 2 ngày',
    },
    banners: [
      {
        tone: 'border-rose-200 bg-rose-50 text-rose-900',
        text: 'AI đã bỏ sót tiền sử dị ứng amoxicillin và chẩn đoán chưa phù hợp. Hãy sửa trực tiếp trường Chẩn đoán và Kế hoạch.',
      },
    ],
    soap: {
      subjective:
        'Bệnh nhi nam 8 tuổi, sốt 38,9°C, ho, chảy mũi trong 2 ngày. Mẹ bé cho biết trẻ ăn kém nhưng vẫn uống nước được. Không nôn, không tiêu chảy.',
      objective:
        'Mạch 110 lần/phút, nhiệt độ 38,7°C, SpO2 97%. Họng đỏ, amidan không mủ rõ. Phổi thông khí hai bên. AI chưa ghi nhận tiền sử dị ứng thuốc từ người nhà.',
      assessment: 'Viêm dạ dày cấp.',
      plan: 'Kê amoxicillin 500mg x 2 lần/ngày. Theo dõi tại nhà.',
    },
    orders: ['Test cúm nhanh nếu sốt tiếp tục tăng', 'Đo lại SpO2 nếu trẻ mệt hơn'],
    prescriptions: ['Amoxicillin 500mg: 2 lần/ngày', 'Paracetamol 250mg gói: dùng khi sốt trên 38,5°C'],
  },
  correction: {
    key: 'correction',
    name: '4. Correction Learning Path',
    tag: 'Chỉnh sửa và ghi nhận học',
    description:
      'Mỗi trường SOAP đều cho phép sửa ở mức field-level. Sau khi lưu, UI phản hồi kín đáo rằng chỉnh sửa đã được ghi nhận để tinh chỉnh AI.',
    alertTone: 'border-sky-200 bg-sky-50 text-sky-700',
    alertText: 'Tập trung demo feedback loop ở từng trường',
    visit: {
      patient: 'Phạm Mai Anh, 31 tuổi',
      doctor: 'BS. Đỗ Hải Nam',
      department: 'Tiêu hóa Vinmec Ocean Park',
      reason: 'Đau thượng vị, ợ chua, đầy bụng sau ăn',
    },
    banners: [
      {
        tone: 'border-sky-200 bg-sky-50 text-sky-900',
        text: 'Hãy bấm Edit ở mục Chẩn đoán hoặc Kế hoạch để trình diễn việc ghi nhận chỉnh sửa cho AI.',
      },
    ],
    soap: {
      subjective:
        'Bệnh nhân nữ 31 tuổi, đau vùng thượng vị âm ỉ 1 tuần, tăng sau bữa tối, kèm ợ nóng và đầy bụng. Không nôn máu, không sụt cân. Từng có đợt tương tự cách đây 6 tháng.',
      objective:
        'Sinh hiệu ổn định, bụng mềm, ấn đau nhẹ vùng thượng vị, không phản ứng thành bụng. Chưa ghi nhận dấu hiệu xuất huyết tiêu hóa.',
      assessment: 'Nghi trào ngược dạ dày thực quản hoặc viêm dạ dày mức độ nhẹ.',
      plan:
        'Điều chỉnh chế độ ăn, tránh ăn khuya, cân nhắc thuốc ức chế bơm proton trong 14 ngày. Tái khám nếu đau tăng hoặc có dấu hiệu báo động.',
    },
    orders: ['Tư vấn thay đổi lối sống chống trào ngược', 'Nội soi tiêu hóa nếu triệu chứng kéo dài hoặc có dấu hiệu báo động'],
    prescriptions: ['Esomeprazole 20mg: 1 viên trước ăn sáng trong 14 ngày', 'Gaviscon hỗn dịch: 10ml sau ăn và trước ngủ nếu còn ợ nóng'],
  },
};

function buildFieldStateMap(soap) {
  return Object.fromEntries(
    Object.entries(soap).map(([fieldKey, text]) => [
      fieldKey,
      {
        aiText: text,
        value: text,
        status: 'pending',
        isEditing: false,
      },
    ])
  );
}

function highlightLowConfidence(text) {
  const parts = text.split(/(\(\?\?\))/g);
  return parts.map((part, index) => {
    if (part === '(??)') {
      return (
        <span key={`${part}-${index}`} className="rounded bg-amber-100 px-1 font-semibold text-amber-800">
          {part}
        </span>
      );
    }
    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
}

function FieldCard({ fieldKey, field, onAccept, onEdit, onDecline, onChange, onSave }) {
  const isPending = field.status === 'pending';
  const isDeclined = field.status === 'declined';
  const isEditing = field.isEditing;
  const helperText =
    fieldKey === 'assessment'
      ? 'Ưu tiên rà soát chẩn đoán vì đây là tín hiệu học quan trọng nhất.'
      : fieldKey === 'plan'
        ? 'Plan và y lệnh nên được bác sĩ xác nhận tường minh trước khi lưu.'
        : null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all duration-200 hover:border-slate-300">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">{FIELD_LABELS[fieldKey]}</h3>
            <span
              className={[
                'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]',
                field.status === 'pending' && 'bg-amber-100 text-amber-800',
                field.status === 'accepted' && 'bg-emerald-100 text-emerald-700',
                field.status === 'edited' && 'bg-sky-100 text-sky-700',
                field.status === 'declined' && 'bg-rose-100 text-rose-700',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {field.status}
            </span>
          </div>
          {helperText ? <p className="mt-2 text-xs leading-5 text-slate-500">{helperText}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {isPending ? (
            <>
              <button
                type="button"
                onClick={onAccept}
                className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                ✓ Accept
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                ✏️ Edit
              </button>
              <button
                type="button"
                onClick={onDecline}
                className="rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
              >
                ✕ Decline
              </button>
            </>
          ) : null}

          {!isPending && !isEditing ? (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              ✏️ Edit
            </button>
          ) : null}

          {isEditing ? (
            <button
              type="button"
              onClick={onSave}
              className="rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Save
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200">
        {isEditing ? (
          <textarea
            value={field.value}
            onChange={(event) => onChange(event.target.value)}
            className="min-h-[148px] w-full resize-y rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none ring-4 ring-blue-50 transition"
            placeholder="Nhập nội dung bệnh án..."
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="block w-full rounded-2xl text-left outline-none transition focus:ring-4 focus:ring-blue-100"
          >
            <p
              className={[
                'min-h-[112px] text-sm leading-7 transition-colors duration-200',
                isPending && 'italic text-slate-400',
                !isPending && !isDeclined && 'text-slate-900',
                isDeclined && !field.value && 'italic text-slate-400',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {field.value ? highlightLowConfidence(field.value) : 'Trường này đã bị từ chối. Bác sĩ có thể bấm Edit để nhập lại từ đầu.'}
            </p>
          </button>
        )}
      </div>
    </div>
  );
}

export default function AiClinicalScribePrototype() {
  const [activeScenario, setActiveScenario] = useState('happy');
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [toast, setToast] = useState('');
  const [fields, setFields] = useState(buildFieldStateMap(SCENARIOS.happy.soap));

  const scenario = SCENARIOS[activeScenario];

  useEffect(() => {
    setFields(buildFieldStateMap(scenario.soap));
    setProgress(0);
    setIsProcessing(false);
    setIsApproved(false);
  }, [activeScenario, scenario.soap]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!isProcessing) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setProgress((current) => {
        const next = current < 75 ? current + 17 : current + 13;
        if (next >= 100) {
          window.clearInterval(interval);
          setIsProcessing(false);
          return 100;
        }
        return next;
      });
    }, 700);

    return () => window.clearInterval(interval);
  }, [isProcessing]);

  const fieldEntries = useMemo(() => Object.entries(fields), [fields]);
  const allReviewed = fieldEntries.length > 0 && fieldEntries.every(([, field]) => field.status !== 'pending');

  const timelineItems = useMemo(() => {
    if (progress === 0) {
      return [['Hệ thống chờ lệnh', 'Bấm "Bắt đầu ghi âm" để mô phỏng cuộc khám 15 phút và sinh bản nháp SOAP.']];
    }
    if (progress < 35) {
      return [
        ['Đang thu âm hội thoại', 'Tách lời bác sĩ và bệnh nhân, gom triệu chứng và dấu hiệu sinh tồn.'],
        ['Đồng bộ ngữ cảnh ca khám', 'Nạp chuyên khoa, thông tin bệnh nhân và tiền sử liên quan.'],
      ];
    }
    if (progress < 75) {
      return [
        ['Đang phiên âm y khoa', 'Chuẩn hóa thuật ngữ tiếng Việt và các cụm lâm sàng trong hội thoại.'],
        ['Đang tạo gợi ý cấu trúc', 'Sinh Subjective, Objective, Assessment, Plan cùng chỉ định và đơn thuốc.'],
      ];
    }
    return [
      ['Bản nháp sẵn sàng', 'Bác sĩ duyệt từng trường theo mô hình Accept, Edit hoặc Decline.'],
      ['Thu tín hiệu học', 'Mỗi chỉnh sửa ở mức field-level được lưu làm dữ liệu tinh chỉnh AI.'],
    ];
  }, [progress]);

  function updateField(fieldKey, updater) {
    setFields((current) => ({
      ...current,
      [fieldKey]: typeof updater === 'function' ? updater(current[fieldKey]) : updater,
    }));
  }

  function handleStartRecording() {
    setIsProcessing(true);
    setProgress(8);
    setIsApproved(false);
    setFields(buildFieldStateMap(scenario.soap));
  }

  function handleAccept(fieldKey) {
    updateField(fieldKey, (field) => ({ ...field, status: 'accepted', isEditing: false }));
  }

  function handleEdit(fieldKey) {
    updateField(fieldKey, (field) => ({ ...field, isEditing: true }));
  }

  function handleDecline(fieldKey) {
    updateField(fieldKey, (field) => ({
      ...field,
      status: 'declined',
      value: '',
      isEditing: false,
    }));
  }

  function handleSave(fieldKey) {
    updateField(fieldKey, (field) => ({
      ...field,
      status: 'edited',
      isEditing: false,
    }));
    setToast('Đã ghi nhận chỉnh sửa để AI học hỏi');
  }

  function handleApproveAll() {
    setIsApproved(true);
    setToast('Đã duyệt và sẵn sàng lưu vào EHR');
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_26%),linear-gradient(180deg,#f4f8fc_0%,#eef3f8_100%)] text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-4 lg:flex-row lg:p-6">
        <aside className="w-full rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-slate-200/50 backdrop-blur lg:w-80">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <span className="text-lg font-bold">+</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Vinmec AI Scribe</p>
              <h1 className="text-lg font-semibold text-slate-900">SOAP Review Prototype</h1>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">Kịch bản demo</p>
            <div className="mt-3 grid gap-2">
              {Object.values(SCENARIOS).map((item) => {
                const active = item.key === activeScenario;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveScenario(item.key)}
                    className={[
                      'rounded-2xl border px-4 py-3 text-left text-sm transition',
                      active
                        ? 'border-blue-200 bg-blue-50 text-blue-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-slate-50',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <div className="font-semibold">{item.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.tag}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-blue-700">Quy tắc an toàn</p>
            <p className="mt-2 leading-6">
              AI chỉ tạo bản nháp. Mỗi trường SOAP cần được bác sĩ xử lý ở mức field-level trước khi lưu vào EHR.
            </p>
          </div>

          <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Thời lượng ghi âm</span>
              <span className="font-semibold">15 phút mô phỏng</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Latency mục tiêu</span>
              <span className="font-semibold">10 - 15 giây</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Vai trò AI</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">Augmentation</span>
            </div>
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-slate-200/50 backdrop-blur lg:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">{scenario.tag}</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">AI Clinical Scribe Agent cho bác sĩ Vinmec</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{scenario.description}</p>
              </div>

              <button
                type="button"
                onClick={handleStartRecording}
                disabled={isProcessing}
                className={[
                  'inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition',
                  isProcessing ? 'cursor-not-allowed bg-slate-400' : 'bg-blue-600 hover:bg-blue-700',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {isProcessing ? 'Đang xử lý cuộc khám...' : 'Bắt đầu ghi âm'}
              </button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr,0.8fr]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">Tiến trình xử lý</p>
                  <span
                    className={[
                      'rounded-full px-3 py-1 text-xs font-semibold',
                      progress === 0 && 'bg-slate-200 text-slate-700',
                      progress > 0 && progress < 100 && 'bg-blue-50 text-blue-700',
                      progress === 100 && 'bg-emerald-100 text-emerald-700',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {progress === 0 ? 'Chưa ghi âm' : progress < 100 ? 'Đang xử lý AI' : 'Bản nháp sẵn sàng'}
                  </span>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-4 grid gap-3 text-sm">
                  {timelineItems.map(([title, text]) => (
                    <div key={title} className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="font-semibold text-slate-800">{title}</div>
                      <div className="mt-1 leading-6 text-slate-500">{text}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-800">Thông tin ca khám</p>
                <div className="mt-4 grid gap-3 text-sm">
                  {[
                    ['Bệnh nhân', scenario.visit.patient],
                    ['Bác sĩ', scenario.visit.doctor],
                    ['Chuyên khoa', scenario.visit.department],
                    ['Lý do khám', scenario.visit.reason],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 p-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{label}</div>
                      <div className="mt-1 text-sm font-medium leading-6 text-slate-700">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {progress === 100 ? (
            <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-slate-200/50 backdrop-blur lg:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Bản nháp SOAP với review theo từng trường</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Ghost-text màu xám là đề xuất của AI đang chờ bác sĩ xác nhận. Mỗi trường có thể Accept, Edit hoặc Decline.
                  </p>
                </div>
                <div className={`rounded-full border px-4 py-2 text-sm font-medium ${scenario.alertTone}`}>{scenario.alertText}</div>
              </div>

              <div className="mt-4 space-y-3">
                {scenario.banners.map((banner) => (
                  <div key={banner.text} className={`rounded-2xl border px-4 py-3 text-sm ${banner.tone}`}>
                    {banner.text}
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-[1.5fr,0.95fr]">
                <div className="space-y-4">
                  {fieldEntries.map(([fieldKey, field]) => (
                    <FieldCard
                      key={fieldKey}
                      fieldKey={fieldKey}
                      field={field}
                      onAccept={() => handleAccept(fieldKey)}
                      onEdit={() => handleEdit(fieldKey)}
                      onDecline={() => handleDecline(fieldKey)}
                      onChange={(value) => updateField(fieldKey, (current) => ({ ...current, value }))}
                      onSave={() => handleSave(fieldKey)}
                    />
                  ))}
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">Chỉ định cận lâm sàng</h3>
                      <span className="text-xs font-medium text-slate-500">Sinh từ Plan</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {scenario.orders.map((item) => (
                        <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
                          <div className="flex gap-3">
                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                            <span>{item}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">Đơn thuốc gợi ý</h3>
                      <span className="text-xs font-medium text-slate-500">Chờ bác sĩ duyệt</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {scenario.prescriptions.map((item) => (
                        <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
                          <div className="flex items-start gap-3">
                            <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">Rx</span>
                            <span>{item}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm text-slate-500">
                  {allReviewed
                    ? 'Tất cả trường SOAP đã được bác sĩ xử lý. Có thể duyệt và lưu vào EHR.'
                    : 'Cần xử lý toàn bộ trường SOAP trước khi nút Duyệt và Lưu được kích hoạt.'}
                </p>
                <button
                  type="button"
                  onClick={handleApproveAll}
                  disabled={!allReviewed || isApproved}
                  className={[
                    'rounded-2xl px-5 py-3 text-sm font-semibold text-white transition',
                    allReviewed && !isApproved ? 'bg-emerald-600 hover:bg-emerald-700' : 'cursor-not-allowed bg-slate-300',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {isApproved ? 'Đã lưu vào EHR' : 'Duyệt và Lưu vào EHR'}
                </button>
              </div>
            </section>
          ) : null}
        </main>
      </div>

      {toast ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-50 w-[min(92vw,420px)] animate-[slideUp_.25s_ease-out] rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-xl shadow-slate-300/30">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</div>
            <div>
              <div className="text-sm font-semibold text-emerald-700">Continuous Learning</div>
              <div className="text-sm leading-6 text-slate-600">{toast}</div>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
