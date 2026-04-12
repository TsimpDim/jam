from django.shortcuts import render
from dj_rest_auth.views import LoginView
from rest_framework.authentication import TokenAuthentication

class ExtensionLoginView(LoginView):
    authentication_classes = [TokenAuthentication]