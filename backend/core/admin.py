from django.contrib import admin
from django.core.mail import send_mail
from .models import Event, GalleryImage, Inquiry, Admission

admin.site.register(Event)
admin.site.register(GalleryImage)
@admin.register(Admission)
class AdmissionAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'student_name', 'class_applying_for', 'parent_name', 'email', 'created_at')
    search_fields = ('student_name', 'parent_name', 'email', 'student_id')
    list_filter = ('class_applying_for', 'gender')
    readonly_fields = ('created_at',)
    
    actions = ['send_email_response']

    @admin.action(description='Send email response to selected applicants')
    def send_email_response(self, request, queryset):
        for admission in queryset:
            send_mail(
                subject=f"Regarding your admission application: {admission.student_name}",
                message="Thank you for your admission application. We have received your submission and will review it shortly.",
                from_email="admin@bestlegacyschool.com",
                recipient_list=[admission.email],
                fail_silently=False,
            )
        self.message_user(request, f"{queryset.count()} emails have been sent.")


@admin.register(Inquiry)
class InquiryAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message')
    readonly_fields = ('created_at',)
    actions = ['mark_as_read', 'mark_as_responded', 'send_email_response']

    @admin.action(description='Mark selected inquiries as Read')
    def mark_as_read(self, request, queryset):
        queryset.update(status='read')

    @admin.action(description='Mark selected inquiries as Responded')
    def mark_as_responded(self, request, queryset):
        queryset.update(status='responded')

    @admin.action(description='Send email response to selected inquiries')
    def send_email_response(self, request, queryset):
        for inquiry in queryset:
            # In a real app, you might want a form to input the message
            # For now, we'll send a generic acknowledgment or could extend this later
            send_mail(
                subject=f"Re: {inquiry.subject}",
                message="Thank you for your inquiry. We have received your message and will get back to you shortly.",
                from_email="admin@bestlegacyschool.com",
                recipient_list=[inquiry.email],
                fail_silently=False,
            )
            # Auto-update status to responded
            inquiry.status = 'responded'
            inquiry.save()
        self.message_user(request, f"{queryset.count()} emails have been sent and inquiries marked as Responded.")
