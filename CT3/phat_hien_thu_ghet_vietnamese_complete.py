import json
import os
import re
import random
import sys
import unicodedata
import warnings

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

try:
    from colorama import just_fix_windows_console

    just_fix_windows_console()
except ImportError:
    pass

try:
    import seaborn as sns
except Exception:
    sns = None

try:
    import torch
except Exception:
    torch = None

try:
    from datasets import Dataset
except Exception:
    Dataset = None

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)

try:
    from transformers import (
        AutoTokenizer,
        AutoModelForSequenceClassification,
        TrainingArguments,
        Trainer,
        DataCollatorWithPadding,
    )
except Exception:
    AutoTokenizer = None
    AutoModelForSequenceClassification = None
    TrainingArguments = None
    Trainer = None
    DataCollatorWithPadding = None

warnings.filterwarnings("ignore")

SEED = 42
MODEL_NAME = "vinai/phobert-base"
OUTPUT_DIR = "./phobert_vihsd_final"
RESULT_DIR = "./results"
MAX_LENGTH = 128

LABEL_NAMES = {0: "BÌNH THƯỜNG", 1: "XÚC PHẠM", 2: "THÙ GHÉT"}
LABEL2ID = {name: label_id for label_id, name in LABEL_NAMES.items()}
LABEL_COLORS = {0: "\033[32m", 1: "\033[33m", 2: "\033[31m"}
WORD_LABELS = {
    0: (),
    1: (
        "ngu ngốc",
        "ngu xuẩn",
        "xúc phạm",
        "đáng xấu hổ",
        "không xứng đáng được người khác tôn trọng",
        "tục",
        "thô lỗ",
        "vô học",
        "mất dạy",
    ),
    2: (
        "khốn nạn",
        "cặn bã",
        "đáng bị chửi",
        "đáng bị ghét",
        "đáng bị tẩy chay",
        "vô dụng",
        "miệt thị",
        "công kích",
        "óc chó",
    ),
}
USER_WORD_LABELS_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "word_labels_user.json",
)
CANDIDATE_STOPWORDS = {
    "ai", "bất", "bị", "bạn", "biết", "bất", "bất kỳ", "bọn", "cả",
    "cái", "các", "cho", "chẳng", "chỉ", "có", "của", "đã", "đang", "đúng",
    "đây", "đó", "được", "gì", "gặp", "hay", "là", "làm", "mà",
    "mình", "mọi", "một", "ngày", "người", "những", "này", "nào",
    "nói", "ở", "phải", "quá", "ra", "rất", "sau", "sẽ", "suốt",
    "ta", "tại", "thật", "thì", "thôi", "trong", "tôi", "từ", "và",
    "vẫn", "vào", "vậy", "với", "vừa", "xong",
}
LABEL_ALIASES = {
    **LABEL2ID,
    "CLEAN": 0,
    "OFFENSIVE": 1,
    "HATE": 2,
}
ID2LABEL = LABEL_NAMES.copy()

os.makedirs(RESULT_DIR, exist_ok=True)

random.seed(SEED)
np.random.seed(SEED)
if torch is not None:
    torch.manual_seed(SEED)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(SEED)

ABBREVIATIONS = {
    "ko": "không",
    "kh": "không",
    "k": "không",
    "hok": "không",
    "hong": "không",
    "dc": "được",
    "đc": "được",
    "j": "gì",
    "gi": "gì",
    "r": "rồi",
    "roi": "rồi",
    "mik": "mình",
    "mn": "mọi người",
    "m.n": "mọi người",
    "vs": "với",
    "nt": "nhắn tin",
    "ib": "nhắn tin",
    "bn": "bạn",
    "cx": "cũng",
    "thik": "thích",
    "iu": "yêu",
    "bt": "biết",
    "z": "vậy",
}


def normalize_text(text):
    text = str(text)
    text = unicodedata.normalize("NFC", text)
    text = text.lower()
    text = re.sub(r"https?://\S+|www\.\S+", " <URL> ", text)
    text = re.sub(r"\S+@\S+", " <EMAIL> ", text)
    text = re.sub(r"@\w+", " <USER> ", text)
    text = re.sub(r"#(\w+)", r" \1 ", text)
    text = re.sub(r"(.)\1{3,}", r"\1\1", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def normalize_abbreviations(text):
    words = text.split()
    return " ".join(ABBREVIATIONS.get(word, word) for word in words)


def preprocess(text):
    return normalize_abbreviations(normalize_text(text))


def find_word_labels(text):
    word_spans = []
    for label_id, terms in WORD_LABELS.items():
        for term in terms:
            term_pattern = r"\s+".join(re.escape(word) for word in term.split())
            pattern = re.compile(rf"(?<!\w){term_pattern}(?!\w)", re.IGNORECASE)
            word_spans.extend((match.start(), match.end(), label_id) for match in pattern.finditer(text))
    return word_spans


def load_user_word_labels():
    if not os.path.exists(USER_WORD_LABELS_PATH):
        return {0: [], 1: [], 2: []}

    try:
        with open(USER_WORD_LABELS_PATH, encoding="utf-8") as labels_file:
            saved_labels = json.load(labels_file)
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError(
            f"Không thể đọc danh sách từ đã duyệt tại {USER_WORD_LABELS_PATH}: {error}"
        ) from error

    if not isinstance(saved_labels, dict):
        raise ValueError(f"Dữ liệu trong {USER_WORD_LABELS_PATH} phải là một object JSON.")

    result = {0: [], 1: [], 2: []}
    for label_id in (0, 1, 2):
        terms = saved_labels.get(str(label_id), [])
        if not isinstance(terms, list) or not all(
            isinstance(term, str) and term.strip() for term in terms
        ):
            raise ValueError(
                f"Danh sách nhãn {label_id} trong {USER_WORD_LABELS_PATH} không hợp lệ."
            )
        result[label_id] = list(dict.fromkeys(term.strip() for term in terms))
    return result


def save_user_word_labels(user_labels):
    serialized = {str(label_id): user_labels[label_id] for label_id in (0, 1, 2)}
    try:
        with open(USER_WORD_LABELS_PATH, "w", encoding="utf-8") as labels_file:
            json.dump(serialized, labels_file, ensure_ascii=False, indent=2)
            labels_file.write("\n")
    except OSError as error:
        raise RuntimeError(
            f"Không thể lưu danh sách từ đã duyệt tại {USER_WORD_LABELS_PATH}: {error}"
        ) from error


def merge_user_word_labels(user_labels):
    for label_id, terms in user_labels.items():
        WORD_LABELS[label_id] = tuple(
            dict.fromkeys((*WORD_LABELS.get(label_id, ()), *terms))
        )


def find_candidate_terms(text):
    known_spans = find_word_labels(text)
    tokens = list(re.finditer(r"\w+", text, re.UNICODE))
    candidates = []
    seen = {
        re.sub(r"\s+", " ", term).casefold()
        for terms in WORD_LABELS.values()
        for term in terms
    }

    for phrase_length in (1, 2):
        for start_index in range(len(tokens) - phrase_length + 1):
            phrase_tokens = tokens[start_index : start_index + phrase_length]
            if any(
                phrase_tokens[index].end() != phrase_tokens[index + 1].start()
                and not text[phrase_tokens[index].end() : phrase_tokens[index + 1].start()].isspace()
                for index in range(phrase_length - 1)
            ):
                continue
            if any(
                token.group().casefold() in CANDIDATE_STOPWORDS
                for token in phrase_tokens
            ):
                continue

            phrase_start = phrase_tokens[0].start()
            phrase_end = phrase_tokens[-1].end()
            if any(
                start < phrase_end and end > phrase_start
                for start, end, _label_id in known_spans
            ):
                continue

            term = text[phrase_start:phrase_end].strip()
            normalized_term = re.sub(r"\s+", " ", term).casefold()
            if normalized_term not in seen:
                seen.add(normalized_term)
                candidates.append((phrase_start, -phrase_length, term))
    return [term for _start, _length, term in sorted(candidates)]


def apply_word_tags(text_widget, text):
    text_widget.tag_remove("normal", "1.0", "end")
    text_widget.tag_remove("offensive", "1.0", "end")
    text_widget.tag_remove("hate", "1.0", "end")
    text_widget.tag_add("normal", "1.0", "end")

    tags_by_label = {1: "offensive", 2: "hate"}
    for start, end, label_id in find_word_labels(text):
        tag = tags_by_label.get(label_id)
        if tag is not None:
            text_widget.tag_add(tag, f"1.0 + {start} chars", f"1.0 + {end} chars")


def colorize_words(text):
    if "NO_COLOR" in os.environ:
        return text

    word_spans = find_word_labels(text)

    colored_parts = []
    for token_match in re.finditer(r"\w+|[^\w]+", text):
        token = token_match.group()
        if not token_match.group().isalnum() and not re.search(r"\w", token):
            colored_parts.append(token)
            continue

        matching_labels = [
            label_id
            for start, end, label_id in word_spans
            if start < token_match.end() and end > token_match.start()
        ]
        label_id = max(matching_labels, default=0)
        colored_parts.append(f"{LABEL_COLORS[label_id]}{token}\033[0m")
    return "".join(colored_parts)


def build_demo_dataset():
    rows = [
        {"text": "Hôm nay trời đẹp quá", "label": 0},
        {"text": "Mày làm ăn kiểu gì vậy", "label": 1},
        {"text": "Đồ ngu, đáng bị chửi", "label": 2},
        {"text": "Tôi cảm thấy rất vui", "label": 0},
        {"text": "Thằng đó nói rất tục", "label": 1},
        {"text": "Khốn nạn, đáng bị tẩy chay", "label": 2},
        {"text": "Cảm ơn bạn đã giúp", "label": 0},
        {"text": "Mày thật thô lỗ", "label": 1},
        {"text": "Bọn lũ cặn bã", "label": 2},
        {"text": "Chúc mọi người ngày mới tốt lành", "label": 0},
        {"text": "Tên đó nói dối quá", "label": 1},
        {"text": "Loài người như vậy đáng bị ghét", "label": 2},
        {"text": "Tôi thích buổi tối này", "label": 0},
        {"text": "Đừng có cãi nữa, thằng ngu", "label": 1},
        {"text": "Bọn vô học đáng bị chửi", "label": 2},
        {"text": "Một ngày tốt đẹp", "label": 0},
        {"text": "Thật là một thằng ngu", "label": 1},
        {"text": "Đồ đáng ghét, bỏ đi", "label": 2},
        {"text": "Tôi rất hài lòng", "label": 0},
        {"text": "Cái thằng đó mất dạy", "label": 1},
    ]
    return pd.DataFrame(rows)


def load_or_build_dataset():
    print("\n[1/10] Dùng dữ liệu mẫu tích hợp sẵn, không cần tải dataset.")
    demo = build_demo_dataset()
    if Dataset is None:
        return {"train": demo.copy(), "validation": demo.copy(), "test": demo.copy()}
    return {
        "train": Dataset.from_pandas(demo, preserve_index=False),
        "validation": Dataset.from_pandas(demo, preserve_index=False),
        "test": Dataset.from_pandas(demo, preserve_index=False),
    }


def prepare_dataframe(df):
    df = df.copy()
    text_candidates = ["text", "comment", "sentence", "content", "free_text"]
    label_candidates = ["label", "labels", "label_id"]

    text_col = next((c for c in text_candidates if c in df.columns), None)
    label_col = next((c for c in label_candidates if c in df.columns), None)
    if text_col is None or label_col is None:
        raise ValueError(f"Không tìm thấy cột text/label. Cột hiện có: {list(df.columns)}")

    df = df.rename(columns={text_col: "text", label_col: "label"})
    df = df.dropna(subset=["text", "label"]).reset_index(drop=True)
    df["text"] = df["text"].astype(str)
    if not pd.api.types.is_numeric_dtype(df["label"].dtype):
        df["label"] = df["label"].astype(str).str.strip().str.upper().map(LABEL_ALIASES)
    df["label"] = pd.to_numeric(df["label"], errors="raise").astype(int)
    df = df[df["label"].isin([0, 1, 2])].reset_index(drop=True)
    return df[["text", "label"]]


def run_svm(train_df, test_df):
    print("\n[2/10] Tiền xử lý dữ liệu...")
    train_df["clean_text"] = train_df["text"].apply(preprocess)
    test_df["clean_text"] = test_df["text"].apply(preprocess)

    print("\n[3/10] Huấn luyện TF-IDF + SVM...")
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, max_df=0.98, sublinear_tf=True)),
        ("svm", LinearSVC(C=1.0, class_weight="balanced")),
    ])
    pipeline.fit(train_df["clean_text"], train_df["label"])
    y_test = test_df["label"]
    pred = pipeline.predict(test_df["clean_text"])

    acc = accuracy_score(y_test, pred)
    prec = precision_score(y_test, pred, average="macro", zero_division=0)
    rec = recall_score(y_test, pred, average="macro", zero_division=0)
    f1 = f1_score(y_test, pred, average="macro", zero_division=0)

    print("\n===== TF-IDF + SVM =====")
    print(f"Độ chính xác : {acc:.4f}")
    print(f"Độ chuẩn xác : {prec:.4f}")
    print(f"Độ bao phủ   : {rec:.4f}")
    print(f"F1 vĩ mô     : {f1:.4f}")
    print_vietnamese_classification_report(y_test, pred)

    if sns is not None:
        cm = confusion_matrix(y_test, pred)
        plt.figure(figsize=(7, 6))
        sns.heatmap(
            cm,
            annot=True,
            fmt="d",
            cmap="Blues",
            xticklabels=list(LABEL_NAMES.values()),
            yticklabels=list(LABEL_NAMES.values()),
        )
        plt.title("Ma trận nhầm lẫn - TF-IDF + SVM")
        plt.ylabel("Nhãn thực tế")
        plt.xlabel("Nhãn dự đoán")
        plt.tight_layout()
        plt.savefig(os.path.join(RESULT_DIR, 'confusion_matrix_svm.png'), dpi=200)
        plt.close()

    print("\n[4/10] Demo dự đoán SVM...")
    for sentence in [
        "Hôm nay trời đẹp quá.",
        "Mày thật sự ngu ngu.",
        "Tôi rất thích sản phẩm này.",
        "Thằng đó thật mất dạy.",
    ]:
        label = pipeline.predict([preprocess(sentence)])[0]
        label_id = int(label)
        print(f"Câu: {colorize_words(sentence)} -> {LABEL_NAMES[label_id]}")

    return pipeline, {"accuracy": acc, "precision": prec, "recall": rec, "f1": f1}


def print_vietnamese_classification_report(y_true, y_pred):
    report = classification_report(
        y_true,
        y_pred,
        target_names=list(LABEL_NAMES.values()),
        output_dict=True,
        zero_division=0,
    )
    rows = [
        (
            label_name,
            report[label_name]["precision"],
            report[label_name]["recall"],
            report[label_name]["f1-score"],
            int(report[label_name]["support"]),
        )
        for label_name in LABEL_NAMES.values()
    ]
    rows.extend(
        (
            vietnamese_name,
            report[english_name]["precision"],
            report[english_name]["recall"],
            report[english_name]["f1-score"],
            int(report[english_name]["support"]),
        )
        for english_name, vietnamese_name in (
            ("macro avg", "Trung bình vĩ mô"),
            ("weighted avg", "Trung bình có trọng số"),
        )
    )
    report_df = pd.DataFrame(
        rows,
        columns=["Nhãn", "Độ chuẩn xác", "Độ bao phủ", "F1", "Số lượng"],
    )
    print(report_df.to_string(index=False, float_format=lambda value: f"{value:.4f}"))
    print(f"Độ chính xác tổng thể: {report['accuracy']:.4f}")


def run_phobert_demo(train_df, val_df, test_df):
    print("\n[5/10] Kiểm tra PhoBERT...")

    if torch is None or AutoTokenizer is None or AutoModelForSequenceClassification is None:
        print("[INFO] PhoBERT bị bỏ qua vì transformers/torch chưa sẵn sàng.")
        print("\n[6/10] Bỏ qua mô hình PhoBERT do môi trường không hỗ trợ.")
        print("\n[7/10] Hoàn tất bước kiểm tra PhoBERT.")
        return None

    if not torch.cuda.is_available():
        print("[INFO] Không có GPU, bỏ qua fine-tune PhoBERT để tránh chạy quá chậm trên CPU.")
        print("\n[6/10] Bỏ qua mô hình PhoBERT vì không có GPU.")
        print("\n[7/10] Hoàn tất bước kiểm tra PhoBERT.")
        return None

    print("\n[6/10] Đang tải tokenizer và mô hình PhoBERT trên GPU...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_fast=False)

    def tokenize(batch):
        return tokenizer(batch["clean_text"], truncation=True, max_length=MAX_LENGTH)

    train_tok = Dataset.from_pandas(train_df[["clean_text", "label"]], preserve_index=False).map(tokenize, batched=True, remove_columns=["clean_text"])
    val_tok = Dataset.from_pandas(val_df[["clean_text", "label"]], preserve_index=False).map(tokenize, batched=True, remove_columns=["clean_text"])
    test_tok = Dataset.from_pandas(test_df[["clean_text", "label"]], preserve_index=False).map(tokenize, batched=True, remove_columns=["clean_text"])

    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=3, id2label=ID2LABEL, label2id=LABEL2ID)

    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        preds = np.argmax(logits, axis=-1)
        return {
            "accuracy": accuracy_score(labels, preds),
            "precision": precision_score(labels, preds, average="macro", zero_division=0),
            "recall": recall_score(labels, preds, average="macro", zero_division=0),
            "macro_f1": f1_score(labels, preds, average="macro", zero_division=0),
        }

    trainer = Trainer(
        model=model,
        args=TrainingArguments(
            output_dir="./phobert_vihsd_training",
            eval_strategy="epoch",
            save_strategy="epoch",
            learning_rate=2e-5,
            per_device_train_batch_size=4,
            per_device_eval_batch_size=8,
            num_train_epochs=1,
            weight_decay=0.01,
            logging_dir="./logs",
            logging_steps=50,
            load_best_model_at_end=True,
            metric_for_best_model="macro_f1",
            greater_is_better=True,
            save_total_limit=1,
            report_to="none",
            fp16=True,
        ),
        train_dataset=train_tok,
        eval_dataset=val_tok,
        tokenizer=tokenizer,
        data_collator=DataCollatorWithPadding(tokenizer=tokenizer),
        compute_metrics=compute_metrics,
    )

    print("\n[7/10] Fine-tune PhoBERT...")
    trainer.train()
    print("\n[8/10] Đánh giá PhoBERT...")
    pred = np.argmax(trainer.predict(test_tok).predictions, axis=-1)
    acc = accuracy_score(test_df["label"], pred)
    prec = precision_score(test_df["label"], pred, average="macro", zero_division=0)
    rec = recall_score(test_df["label"], pred, average="macro", zero_division=0)
    f1 = f1_score(test_df["label"], pred, average="macro", zero_division=0)

    print("\n===== PHOBERT =====")
    print(f"Độ chính xác : {acc:.4f}")
    print(f"Độ chuẩn xác : {prec:.4f}")
    print(f"Độ bao phủ   : {rec:.4f}")
    print(f"F1 vĩ mô     : {f1:.4f}")
    print_vietnamese_classification_report(test_df["label"], pred)

    print("\n[9/10] Lưu mô hình PhoBERT...")
    trainer.save_model(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    return {"accuracy": acc, "precision": prec, "recall": rec, "f1": f1}


def interactive_predict(model):
    import tkinter as tk
    from tkinter import ttk
    from tkinter import messagebox

    root = tk.Tk()
    root.title("Phát hiện ngôn ngữ thù ghét tiếng việt")
    root.geometry("820x400")

    user_word_labels = load_user_word_labels()
    merge_user_word_labels(user_word_labels)

    frame = ttk.Frame(root, padding=12)
    frame.pack(fill="both", expand=True)

    ttk.Label(
        frame,
        text="Nhập câu tiếng Việt; màu từ sẽ được hiển thị trực tiếp trong khung:",
    ).pack(anchor="w")

    text_box = tk.Text(
        frame,
        height=10,
        wrap="word",
        font=("Segoe UI", 12),
    )
    text_box.pack(fill="both", expand=True, pady=(6, 10))
    text_box.tag_configure("normal", foreground="#16803c")
    text_box.tag_configure("offensive", foreground="#b77900")
    text_box.tag_configure("hate", foreground="#d00000")
    text_box.tag_raise("offensive", "normal")
    text_box.tag_raise("hate", "offensive")

    status = ttk.Label(
        frame,
        text="Xanh lá: Bình thường  |  Vàng: Xúc phạm  |  Đỏ: Thù ghét",
    )
    status.pack(anchor="w")

    def refresh_word_colors():
        sentence = text_box.get("1.0", "end-1c")
        apply_word_tags(text_box, sentence)

    def highlight_text():
        sentence = text_box.get("1.0", "end-1c")
        refresh_word_colors()
        if not sentence.strip():
            status.configure(text="Xanh lá: bình thường  |  Vàng: xúc phạm  |  Đỏ: thù ghét")
            return
        label_id = int(model.predict([preprocess(sentence)])[0])
        status.configure(text=f"Nhãn tổng thể của câu: {LABEL_NAMES[label_id]}")

    def suggest_new_words():
        sentence = text_box.get("1.0", "end-1c").strip()
        if not sentence:
            messagebox.showinfo("Chưa có câu", "Hãy nhập câu trước khi tìm từ mới.", parent=root)
            return

        label_id = int(model.predict([preprocess(sentence)])[0])

        candidates = find_candidate_terms(sentence)
        if not candidates:
            messagebox.showinfo(
                "Không có từ mới",
                "Không tìm thấy từ/cụm từ mới chưa có trong WORD_LABELS.",
                parent=root,
            )
            return

        review = tk.Toplevel(root)
        review.title("Duyệt từ mới được gợi ý")
        review.geometry("500x420")
        review.transient(root)

        review_frame = ttk.Frame(review, padding=12)
        review_frame.pack(fill="both", expand=True)
        ttk.Label(
            review_frame,
            text=(
                f"Mô hình xếp cả câu là {LABEL_NAMES[label_id].lower()}. "
                "Các mục dưới đây chưa có trong WORD_LABELS; mô hình không tự "
                "xác định nhãn từng từ. Bạn có thể chọn lại nhãn cho từng mục "
                "sau khi kiểm tra ngữ cảnh:"
            ),
            wraplength=460,
        ).pack(anchor="w", pady=(0, 8))

        list_frame = ttk.Frame(review_frame)
        list_frame.pack(fill="both", expand=True)
        candidate_list = tk.Listbox(
            list_frame,
            selectmode="extended",
            exportselection=False,
            font=("Segoe UI", 11),
        )
        candidate_list.pack(side="left", fill="both", expand=True)
        scrollbar = ttk.Scrollbar(
            list_frame,
            orient="vertical",
            command=candidate_list.yview,
        )
        scrollbar.pack(side="right", fill="y")
        candidate_list.configure(yscrollcommand=scrollbar.set)
        for candidate in candidates:
            candidate_list.insert("end", candidate)

        ttk.Label(review_frame, text="Chọn nhãn sau khi kiểm tra ngữ cảnh:").pack(
            anchor="w", pady=(10, 4)
        )
        label_display_names = {
            0: "BÌNH THƯỜNG (xanh)",
            1: "XÚC PHẠM (vàng)",
            2: "THÙ GHÉT (đỏ)",
        }
        label_choice = tk.StringVar(value=label_display_names[label_id])
        ttk.Combobox(
            review_frame,
            textvariable=label_choice,
            values=tuple(label_display_names.values()),
            state="readonly",
        ).pack(fill="x")

        def save_selected_terms():
            selected_indices = candidate_list.curselection()
            if not selected_indices:
                messagebox.showwarning(
                    "Chưa chọn từ",
                    "Hãy chọn ít nhất một từ/cụm từ cần lưu.",
                    parent=review,
                )
                return

            selected_terms = [candidate_list.get(index) for index in selected_indices]
            selected_label_id = next(
                label_id
                for label_id, display_name in label_display_names.items()
                if label_choice.get() == display_name
            )
            label_name = LABEL_NAMES[selected_label_id]
            if not messagebox.askyesno(
                "Xác nhận lưu",
                f"Lưu {len(selected_terms)} mục vào nhóm {label_name}?\n\n"
                + "\n".join(selected_terms),
                parent=review,
            ):
                return

            existing_terms = {
                term.casefold()
                for terms in user_word_labels.values()
                for term in terms
            }
            new_terms = [
                term
                for term in selected_terms
                if term.casefold() not in existing_terms
            ]
            user_word_labels[selected_label_id].extend(new_terms)
            try:
                save_user_word_labels(user_word_labels)
            except RuntimeError as error:
                messagebox.showerror("Không thể lưu từ mới", str(error), parent=review)
                return

            merge_user_word_labels({selected_label_id: new_terms})
            refresh_word_colors()
            status.configure(
                text=f"Đã lưu {len(new_terms)} mục mới vào nhóm {label_name}."
            )
            review.destroy()

        ttk.Button(
            review_frame,
            text="Lưu từ đã chọn",
            command=save_selected_terms,
        ).pack(anchor="e", pady=(10, 0))

    button_frame = ttk.Frame(frame)
    button_frame.pack(anchor="e")
    ttk.Button(
        button_frame,
        text="Gợi ý từ mới",
        command=suggest_new_words,
    ).pack(side="left", padx=(0, 8))
    ttk.Button(
        button_frame,
        text="Phân loại câu",
        command=highlight_text,
    ).pack(side="left")

    def on_text_modified(_event=None):
        if not text_box.edit_modified():
            return
        text_box.edit_modified(False)
        root.after_idle(refresh_word_colors)

    text_box.bind("<<Modified>>", on_text_modified)
    text_box.edit_modified(False)
    root.mainloop()


def main():
    print("=" * 75)
    print("PHÁT HIỆN PHÁT NGÔN THÙ GHÉT TIẾNG VIỆT")
    print("TF-IDF + SVM so với PhoBERT")
    print("=" * 75)
    print("Phiên bản PyTorch:", torch.__version__ if torch is not None else "không khả dụng")
    print("Có GPU CUDA:", bool(torch is not None and torch.cuda.is_available()))

    dataset = load_or_build_dataset()
    if isinstance(dataset, dict):
        to_dataframe = lambda split: split.to_pandas() if hasattr(split, "to_pandas") else split
        train_df = prepare_dataframe(to_dataframe(dataset["train"]))
        val_df = prepare_dataframe(to_dataframe(dataset["validation"]))
        test_df = prepare_dataframe(to_dataframe(dataset["test"]))
    else:
        train_df = prepare_dataframe(dataset["train"].to_pandas())
        val_df = prepare_dataframe(dataset["validation"].to_pandas()) if "validation" in dataset else prepare_dataframe(dataset["train"].to_pandas())
        test_df = prepare_dataframe(dataset["test"].to_pandas())

    print("\nKích thước dữ liệu:")
    print("Huấn luyện:", train_df.shape)
    print("Xác thực:", val_df.shape)
    print("Kiểm tra:", test_df.shape)

    svm_model, svm_metrics = run_svm(train_df.copy(), test_df.copy())
    phobert_metrics = run_phobert_demo(train_df.copy(), val_df.copy(), test_df.copy())

    print("\n[10/10] KẾT THÚC")
    print("TF-IDF + SVM đã chạy thành công trên dữ liệu mẫu.")
    if phobert_metrics is None:
        print("PhoBERT được bỏ qua an toàn vì máy không có GPU hoặc môi trường không hỗ trợ fine-tune.")
    else:
        print("PhoBERT đã chạy thành công trên GPU.")

    print("\nTổng kết:")
    print(f"- SVM: Độ chính xác={svm_metrics['accuracy']:.4f}, F1 vĩ mô={svm_metrics['f1']:.4f}")
    if phobert_metrics is not None:
        print(f"- PhoBERT: Độ chính xác={phobert_metrics['accuracy']:.4f}, F1 vĩ mô={phobert_metrics['f1']:.4f}")

    interactive_predict(svm_model)


if __name__ == "__main__":
    main()
