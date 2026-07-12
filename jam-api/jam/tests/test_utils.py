from django.test import TestCase
from jam.utils import remove_circular_links


class RemoveCircularLinksTest(TestCase):
    def test_no_links(self):
        result = remove_circular_links({})
        self.assertEqual(result, {})

    def test_linear_links(self):
        links = {
            "0->1": {"source": 0, "target": 1, "value": 1},
            "1->2": {"source": 1, "target": 2, "value": 1},
        }
        result = remove_circular_links(links)
        self.assertEqual(len(result), 2)

    def test_self_loop_removed(self):
        links = {
            "0->0": {"source": 0, "target": 0, "value": 1},
        }
        result = remove_circular_links(links)
        self.assertEqual(len(result), 0)

    def test_simple_cycle_removed(self):
        links = {
            "0->1": {"source": 0, "target": 1, "value": 1},
            "1->2": {"source": 1, "target": 2, "value": 1},
            "2->0": {"source": 2, "target": 0, "value": 1},
        }
        result = remove_circular_links(links)
        self.assertEqual(len(result), 2)

    def test_cycle_with_back_edge_removed(self):
        links = {
            "0->1": {"source": 0, "target": 1, "value": 1},
            "1->2": {"source": 1, "target": 2, "value": 1},
            "2->1": {"source": 2, "target": 1, "value": 1},
        }
        result = remove_circular_links(links)
        self.assertEqual(len(result), 2)
        keys = list(result.keys())
        self.assertIn("0->1", keys)
        self.assertIn("1->2", keys)
