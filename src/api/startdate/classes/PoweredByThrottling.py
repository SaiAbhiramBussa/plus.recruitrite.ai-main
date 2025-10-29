from rest_framework.throttling import UserRateThrottle


class PlaygroundThrottling(UserRateThrottle):
    def allow_request(self, request, view):
        if request.user.is_anonymous:
            total_limit = 6
            return True
        return False
