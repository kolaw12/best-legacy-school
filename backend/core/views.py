from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.mail import send_mail
from .models import Event, GalleryImage, Inquiry, Admission, StudentResult
from .serializers import EventSerializer, GalleryImageSerializer, InquirySerializer, AdmissionSerializer, StudentResultSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

class GalleryImageViewSet(viewsets.ModelViewSet):
    queryset = GalleryImage.objects.all()
    serializer_class = GalleryImageSerializer

class InquiryViewSet(viewsets.ModelViewSet):
    queryset = Inquiry.objects.all()
    serializer_class = InquirySerializer

class AdmissionViewSet(viewsets.ModelViewSet):
    queryset = Admission.objects.all()
    serializer_class = AdmissionSerializer

    def _send_email_async(self, subject, message, recipient_list):
        from django.conf import settings
        import threading
        
        def send():
            try:
                print(f"DEBUG: Attempting to send email to {recipient_list}")
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=recipient_list,
                    fail_silently=False,
                )
                print(f"DEBUG: Email sent successfully to {recipient_list}")
            except Exception as e:
                print(f"ERROR: Failed to send email to {recipient_list}: {str(e)}")
        
        thread = threading.Thread(target=send)
        thread.start()

    def get_queryset(self):
        queryset = Admission.objects.all()
        student_id = self.request.query_params.get('student_id')
        class_name = self.request.query_params.get('class')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if class_name:
            queryset = queryset.filter(class_applying_for=class_name)
        return queryset

    def perform_create(self, serializer):
        # Generate Student ID
        import datetime
        import threading
        from django.conf import settings

        year = datetime.date.today().year
        prefix = f"BLS/{year}/"
        
        # Find the highest sequence number for this year to avoid collisions
        latest_admission = Admission.objects.filter(student_id__startswith=prefix).order_by('-student_id').first()
        
        if latest_admission and latest_admission.student_id:
            try:
                # Extract numbers from the current format (e.g., "BLS/2026/003")
                parts = latest_admission.student_id.split('/')
                last_num = int(parts[-1])
                next_num = last_num + 1
            except (ValueError, IndexError):
                next_num = Admission.objects.filter(created_at__year=year).count() + 1
        else:
            next_num = 1

        generated_id = f"{prefix}{next_num:03d}"
        
        # Double safety: check for collision in case of race conditions
        while Admission.objects.filter(student_id=generated_id).exists():
            next_num += 1
            generated_id = f"{prefix}{next_num:03d}"
        
        instance = serializer.save(student_id=generated_id)
        
        subject = f"Admission Application Received - {instance.student_name}"
        message = f"""Dear {instance.parent_name},

Thank you for applying to Best Legacy Divine School.

We have received the admission application for {instance.student_name}.
Your Student Registration Number (Student ID) is: {generated_id}

Please keep this ID safe as it may be required for checking results later.

Our admissions team will review the details and contact you shortly.

Best regards,
Admissions Team
Best Legacy Divine School"""
        
        self._send_email_async(subject, message, [instance.email])

    def perform_update(self, serializer):
        # Fetch status BEFORE saving to check for changes
        old_status = self.get_object().status
        instance = serializer.save()
        
        if old_status != instance.status:
            subject = ""
            message = ""
            
            if instance.status == 'accepted':
                subject = f"Admission Accepted - {instance.student_name}"
                message = f"""Dear {instance.parent_name},

Congratulations! We are pleased to inform you that {instance.student_name} has been accepted to Best Legacy Divine School.

Student ID: {instance.student_id}
Class: {instance.class_applying_for}

Please visit the school office to complete the registration process.

Best regards,
Admissions Team
Best Legacy Divine School"""
            elif instance.status == 'rejected':
                subject = f"Admission Update - {instance.student_name}"
                message = f"""Dear {instance.parent_name},

Thank you for your interest in Best Legacy Divine School.

After careful review, we regret to inform you that we are unable to offer admission to {instance.student_name} at this time.

We wish you the best in finding the right placement for your child.

Best regards,
Admissions Team
Best Legacy Divine School"""

            if subject and message:
                self._send_email_async(subject, message, [instance.email])

    @action(detail=False, methods=['post'])
    def test_email(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=400)
            
        subject = "Test Email - Best Legacy Divine School"
        message = "This is a test email to verify that your school website's email system is working correctly."
        
        self._send_email_async(subject, message, [email])
        return Response({'message': f'Test email triggered for {email}. Please check your inbox (and spam folder) in a few seconds.'})

class StudentResultViewSet(viewsets.ModelViewSet):
    queryset = StudentResult.objects.all()
    serializer_class = StudentResultSerializer

    def get_queryset(self):
        queryset = StudentResult.objects.all()
        student_id = self.request.query_params.get('student_id')
        term = self.request.query_params.get('term')
        session = self.request.query_params.get('session')
        student_class = self.request.query_params.get('student_class')
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if term:
            queryset = queryset.filter(term=term)
        if session:
            queryset = queryset.filter(session=session)
        if student_class:
            queryset = queryset.filter(student_class=student_class)
            
        return queryset
