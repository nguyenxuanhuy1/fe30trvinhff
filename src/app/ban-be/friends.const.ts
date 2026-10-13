const friendsPage = {
  title: "Bạn bè",
  description: "Tạo nhóm, tìm bạn và mời người chơi tham gia nhóm của bạn.",
  backLabel: "Quay lại",
  sections: {
    invitations: "Lời mời nhận được",
    group: "Nhóm của tôi",
    create: "Tạo nhóm mới",
    search: "Tìm bạn bè",
    sent: "Đã gửi lời mời",
  },
  hints: {
    noGroup: "Bạn chưa có nhóm nào. Tạo một nhóm để bắt đầu kết bạn.",
    oneGroupOnly: "Mỗi người chỉ được ở trong một nhóm. Khi đã có nhóm, bạn không thể tạo thêm.",
    ownerOnly: "Chỉ chủ nhóm mới tìm và mời được thành viên mới.",
    searchPlaceholder: "Nhập tài khoản để tìm bạn",
    namePlaceholder: "Nhập tên nhóm",
    emptyInvitations: "Bạn chưa có lời mời nào.",
    emptySearch: "Không tìm thấy ai phù hợp.",
    emptySent: "Bạn chưa gửi lời mời nào.",
    searchPrompt: "Nhập tài khoản rồi bấm tìm để xem danh sách bạn bè.",
  },
  badges: {
    owner: "Chủ nhóm",
    member: "Thành viên",
    hasGroup: "Đã có nhóm",
    invited: "Đã gửi lời mời",
    inGroup: "Trong nhóm bạn",
  },
  buttons: {
    create: "Tạo nhóm",
    search: "Tìm bạn",
    invite: "Mời vào nhóm",
    accept: "Chấp nhận",
    reject: "Từ chối",
    leave: "Rời nhóm",
  },
  streak: {
    title: "Ngọn lửa chuỗi",
    keeper: "Đang giữ chuỗi",
    days: (count: number) => `${count} Ngày`,
    hint: "Chức năng chuỗi chưa kích hoạt. Hoàn thành bài học mỗi ngày cùng nhóm để thắp sáng ngọn lửa!",
  },
  confirmLeave: {
    title: "Rời khỏi nhóm",
    prompt: (groupName: string, isOwner: boolean) =>
      isOwner
        ? `Bạn là trưởng nhóm "${groupName}". Nếu rời đi, quyền trưởng nhóm sẽ được chuyển giao hoặc giải tán nhóm nếu không còn ai. Bạn có chắc không?`
        : `Bạn có chắc chắn muốn rời khỏi nhóm "${groupName}" không?`,
    confirm: "Xác nhận rời",
    cancel: "Ở lại",
  },
  loading: "Đang tải...",
  inviteFrom: (username: string) => `${username} đã mời bạn tham gia nhóm`,
  members: (count: number) => `${count} thành viên`,
  memberSince: (date: string) => `Tham gia ${new Date(date).toLocaleDateString("vi-VN")}`,
} as const;

export { friendsPage };
