from django.http import JsonResponse
from django.core.exceptions import ObjectDoesNotExist


class Custom404MiddleWare:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if response.status_code == 404 and response.get('Content-Type', '').startswith('text/html'):
            try:
                raise ObjectDoesNotExist
            except ObjectDoesNotExist:
                response_data = {
                    "Message": "The requested resource was not found.",
                }
                return JsonResponse(response_data, status=404)
        return response
