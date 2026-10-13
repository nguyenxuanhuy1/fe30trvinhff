interface FeatureItem {
  number: string;
  title: string;
  description: string;
}

const steamFeatures: readonly FeatureItem[] = [
  {
    number: "01",
    title: "HỌC QUA TRÒ CHƠI",
    description:
      "Mỗi bài học là một màn chơi, hiểu kiến thức mới mới vượt được thử thách.",
  },
  {
    number: "02",
    title: "TƯƠNG TÁC BẰNG ĐÔI TAY",
    description:
      "Dùng camera và hand tracking để thao tác trực tiếp, không cần chuột.",
  },
  {
    number: "03",
    title: "NHẬN QUÀ & VẬT PHẨM",
    description:
      "Hoàn thành bài học để nhận item, AI gắn thẳng lên khuôn mặt bạn.",
  },
];

const missionPillars: readonly FeatureItem[] = [
  {
    number: "01",
    title: "GẦN GŨI",
    description:
      "Bài học dễ hiểu, giao diện thân thiện, hợp lứa tuổi cấp 2.",
  },
  {
    number: "02",
    title: "ĐÁNG TIN CẬY",
    description: "Kiến thức chính xác, nội dung an toàn cho học sinh.",
  },
  {
    number: "03",
    title: "CÙNG NHAU",
    description: "Học cùng bạn bè, so thành tích và chia sẻ phần thưởng.",
  },
];

const teamGroups: readonly FeatureItem[] = [
  {
    number: "01",
    title: "QUẢN LÝ",
    description:
      "Điều phối cả nhóm, giữ tiến độ và định hướng sản phẩm.",
  },
  {
    number: "02",
    title: "TRUYỀN THÔNG",
    description:
      "Đưa sản phẩm đến học sinh, giáo viên và phụ huynh.",
  },
  {
    number: "03",
    title: "Ý TƯỞNG",
    description:
      "Biến kiến thức khô khan thành màn chơi và phần thưởng hấp dẫn.",
  },
  {
    number: "04",
    title: "TRIỂN KHAI",
    description:
      "Xây dựng hand tracking, AI nhận diện mặt và toàn bộ hệ thống.",
  },
];

export { missionPillars, steamFeatures, teamGroups };
export type { FeatureItem };
