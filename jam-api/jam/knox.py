from knox.models import AuthToken

class KnoxTokenWrapper:
    def __init__(self, token, user):
        self.token = token
        self.user = user

def create_knox_token(token_model, user, serializer):
    instance, token = AuthToken.objects.create(user=user)
    
    # Return the wrapper object instead of the raw string
    # this is because dj-rest-auth expects the creator to return an instance of the token model, but Knox returns a string
    return KnoxTokenWrapper(token, user)