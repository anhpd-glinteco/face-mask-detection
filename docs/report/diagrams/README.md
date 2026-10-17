# Sơ đồ P1

Đây là **thiết kế mục tiêu**, không là bằng chứng tính năng đã chạy. Đối chiếu với
code/contract và host thật ở P11/P12. Source không chứa secret hoặc media khuôn mặt.

`system.puml` gồm 9 hình có tên: use-cases, activity-image, activity-stream,
sequence-image, sequence-stream, media-state, components, deployment, training-pipeline.
`architecture.mmd` giữ kiến trúc/pipeline ở Mermaid để xem trong công cụ hỗ trợ.
`architecture.svg` là bản xuất của source Mermaid; chín SVG cùng tên với block
PlantUML là bản xuất để đọc tại repo và dùng trong báo cáo.

Render PlantUML bằng JAR đặt ngoài repo, Java 21; `smetana` tránh yêu cầu Graphviz:

```powershell
java -Xmx256m -Djava.awt.headless=true -jar D:\Codex\downloads\face-mask-detection\tools\plantuml.jar -charset UTF-8 -tsvg docs/report/diagrams/system.puml
```

Render Mermaid bằng CLI ngoài dependency của ứng dụng:

```powershell
mmdc -i docs/report/diagrams/architecture.mmd -o docs/report/diagrams/architecture.svg -b white
```

Chỉ chạy lệnh Mermaid khi có CLI trong môi trường tài liệu; không thêm dependency
renderer vào web chỉ để xuất hình. Bản PDF/DOCX và copies của SVG đặt ngoài repo
tại `D:\Codex\outputs\face-mask-detection` khi bàn giao.

PlantUML use-case giữ actor người sử dụng, không dùng API/model làm actor nghiệp vụ.
Không thêm quan hệ include/extend khi đặc tả chưa cần; xem kết quả/dừng là thao tác
người dùng. Activity/sequence thể hiện lỗi, stale response, cancel và backpressure.
