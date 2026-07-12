from io import BytesIO
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from jam.validators import validate_cv_file, CV_LIMIT_FREE, CV_LIMIT_PREMIUM, MAX_CV_FILE_SIZE


class ValidateCVFileTest(TestCase):
    def test_valid_pdf(self):
        f = SimpleUploadedFile("test.pdf", b"%PDF-1.4 content", content_type="application/pdf")
        try:
            validate_cv_file(f)
        except ValidationError:
            self.fail("validate_cv_file raised for valid PDF")

    def test_valid_doc(self):
        f = SimpleUploadedFile("test.doc", b"fake doc content", content_type="application/msword")
        try:
            validate_cv_file(f)
        except ValidationError:
            self.fail("validate_cv_file raised for valid DOC")

    def test_valid_docx(self):
        f = SimpleUploadedFile("test.docx", b"fake docx content")
        try:
            validate_cv_file(f)
        except ValidationError:
            self.fail("validate_cv_file raised for valid DOCX")

    def test_invalid_extension(self):
        f = SimpleUploadedFile("test.exe", b"binary content")
        with self.assertRaises(ValidationError):
            validate_cv_file(f)

    def test_invalid_extension_png(self):
        f = SimpleUploadedFile("test.png", b"PNG content")
        with self.assertRaises(ValidationError):
            validate_cv_file(f)

    def test_file_too_large(self):
        content = b"a" * (MAX_CV_FILE_SIZE + 1)
        f = SimpleUploadedFile("test.pdf", content, content_type="application/pdf")
        with self.assertRaises(ValidationError):
            validate_cv_file(f)

    def test_file_just_under_limit(self):
        content = b"a" * (MAX_CV_FILE_SIZE - 1)
        f = SimpleUploadedFile("test.pdf", content, content_type="application/pdf")
        try:
            validate_cv_file(f)
        except ValidationError:
            self.fail("validate_cv_file raised for file just under size limit")

    def test_case_insensitive_extension(self):
        f = SimpleUploadedFile("test.PDF", b"%PDF-1.4", content_type="application/pdf")
        try:
            validate_cv_file(f)
        except ValidationError:
            self.fail("validate_cv_file raised for uppercase PDF")

    def test_constants(self):
        self.assertEqual(CV_LIMIT_FREE, 1)
        self.assertEqual(CV_LIMIT_PREMIUM, 10)
        self.assertEqual(MAX_CV_FILE_SIZE, 1 * 1024 * 1024)
