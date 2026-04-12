from django.shortcuts import render
from dj_rest_auth.views import LoginView, LogoutView
from knox.auth import TokenAuthentication

class ExtensionLoginView(LoginView):
    authentication_classes = [TokenAuthentication]

class ExtensionLogoutView(LogoutView):
    authentication_classes = [TokenAuthentication]