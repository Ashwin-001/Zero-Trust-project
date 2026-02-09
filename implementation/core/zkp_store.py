# Centralized store for ZKP challenges to avoid circular imports
# and ensure consistency across views and serializers.

# IMPORTANT: This is an in-memory store, which is not suitable for production.
# In a multi-process or multi-threaded environment, this will not work correctly.
# A distributed cache (like Redis) or a database should be used to store the challenges
# to ensure that all workers have access to the same challenge store.

from collections import OrderedDict

class LimitedSizeDict(OrderedDict):
    def __init__(self, *args, max_size=1000, **kwargs):
        self.max_size = max_size
        super().__init__(*args, **kwargs)

    def __setitem__(self, key, value):
        if len(self) >= self.max_size:
            self.popitem(last=False)
        super().__setitem__(key, value)

CHALLENGES = LimitedSizeDict()
