from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from decouple import config
from startdate.settings import EMAIL_CLIENT

DEFAULT_EMAIL = config("DEFAULT_EMAIL")


class StartDateEmail:
    def __init__(self, email):
        self.body_data = email.get('body_data')
        self.template = email.get('template')
        self.subject = email.get('subject')
        self.to_email = email.get('to_email')
        self.bcc = email.get('bcc')

    def __call__(self):
        email_body = render_to_string(self.template, self.body_data)
        subject = self.subject
        to_email = self.to_email
        bcc = self.bcc
        from_email = DEFAULT_EMAIL

        message = {
            "senderAddress": from_email,  
            "recipients": {
                "to": [{"address": to_email}],
                "bcc": [{"address": bcc}]
            },
            "content": {
                "subject": subject,
                "html": email_body
            }
        }
        EMAIL_CLIENT.begin_send(message)
