from rest_framework import permissions
from candidate.models import Candidate
from company.models import Location
from job_posting.models import JobPosting
from job_posting.services import is_valid_employer, is_valid_company
from rest_framework import status, generics
from rest_framework.response import Response


class AdminPermission(permissions.BasePermission):
    """
    Permission class for System and Partner Admins.
    """
    def has_permission(self, request, view):
        # check for authentication
        if request.user.is_authenticated:
            # allow access to superusers, admins
            if request.user.is_superuser or request.user.role == 'admin':
                return True
        if request._auth:
            request._auth.delete()
        return False


class EmployerPermission(permissions.BasePermission):
    """
    Permission class for Employer.
    """
    def has_permission(self, request, view):
        if hasattr(request, 'company'):
            if request.company.is_authenticated:
                return True
        if request.user.is_authenticated:
            if request.user.is_superuser or request.user.role == 'admin' or request.user.role == 'employer' or request.user.role == 'hiring_manager':
                return True
        if request._auth:
            request._auth.delete()
        return False


class JobSeekerPermission(permissions.BasePermission):
    """
        Permission class for Candidate.
        """

    def has_permission(self, request, view):
        # check for authentication
        if request.user.is_authenticated:
            if request.user.is_superuser or request.user.role == 'admin' or request.user.role == 'job_seeker':
                return True
        if request._auth:
            request._auth.delete()
        return False


class EmployerSpecificObjectPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        job_posting_id = view.kwargs.get('job_posting_id')
        company_id = view.kwargs.get('company_id')
        location_id = view.kwargs.get('location_id')
        job_posting = JobPosting.objects.filter(id=job_posting_id).first() if job_posting_id else None
        location = Location.objects.filter(id=location_id).first() if location_id else None
        if hasattr(request, 'company'):
            if request.company.is_authenticated:
                if job_posting_id:
                    if not job_posting:
                        return False
                    is_valid = is_valid_company(request, job_posting)
                    if not is_valid:
                        return False
                if location_id:
                    if not location:
                        return False
                    is_valid = is_valid_company(request, location)
                    if not is_valid:
                        return False
                return True
        if request.user.is_authenticated:
            if request.user.role == 'employer' or request.user.role == 'hiring_manager':
                if job_posting_id:
                    if not job_posting:
                        return False
                    is_valid = is_valid_employer(request, job_posting)
                    if not is_valid:
                        return False
                elif company_id:
                    if not company_id == request.user.location_id.company_id.id:
                        return False
                elif location_id:
                    is_valid = is_valid_employer(request, location)
                    if not is_valid:
                        return False
                return True
            elif request.user.role == 'admin':
                return True
        if request._auth:
            request._auth.delete()
        return False


class JobSeekerSpecificObjectPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        candidate_id = view.kwargs.get('candidate_id')
        if request.user.is_authenticated:
            if request.user.role == 'admin':
                return True
            if request.user.role == 'job_seeker':
                fetched_candidate = Candidate.objects.filter(user_id_id=request.user.id).first()
                if not fetched_candidate:
                    return False
                if not candidate_id == fetched_candidate.id:
                    return False
                return True

        if request._auth:
            request._auth.delete()
        return False