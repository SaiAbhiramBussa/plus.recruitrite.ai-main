from accounts.classes.Email import StartDateEmail


class EmailNotification:

    def __init__(self, email_notification, receiver):
        self.type = email_notification.get("type")
        self.receiver_role = receiver.role
        self.content = email_notification.get("content")
        self.receiver = receiver

    def __call__(self):
        if self.type == 'new_match':
            self.__new_match()

        elif self.type == 'new_message':
            self.__new_message()

    def __new_message(self):
        body_data = {
            'job_posting': self.content.get("job_posting"),
            'sender': self.content.get("name"),
            'picture': self.content.get("picture"),
            'messages': self.content.get("messages"),
        }
        email = {
            'body_data': body_data,
            'template': 'newMessageTemplate.html',
            'subject': 'New Message',
            'to_email': [self.receiver.email],
            'bcc': []
        }
        sd_email = StartDateEmail(email)
        sd_email()

    def __new_match(self):
        body_data = {
            'header_msg': 'New Match',
            'body_msg': f'You have got a new match for {self.content.get("job_posting")}. Please check startdate for details',
            'name': self.content.get("company"),
            'picture': self.content.get("logo"),
            'job_posting': self.content.get("job_posting"),
        }
        email = {
            'body_data': body_data,
            'template': 'newMatchTemplate.html',
            'subject': f'New Match for {self.content.get("job_posting")}',
            'to_email': [self.receiver.email],
            'bcc': []
        }
        sd_email = StartDateEmail(email)
        sd_email()
