class CreatorOSError(Exception):
    """Base exception for all CreatorOS errors"""
    pass

class ResourceNotFoundError(CreatorOSError):
    """Raised when a requested resource is not found"""
    pass

class ValidationError(CreatorOSError):
    """Raised when data validation fails"""
    pass
