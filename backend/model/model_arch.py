import torch
import torch.nn as nn
from torchvision.models.detection import FasterRCNN
from torchvision.models.detection.rpn import AnchorGenerator
from torchvision.models.detection.backbone_utils import resnet_fpn_backbone
from torchvision import transforms

'''
    Define model architectures for object classification using CNN
'''
class RecognitionModel_V1(nn.Module):
    def __init__(self, num_classes=43):
        super(RecognitionModel_V1, self).__init__()

        self.model = nn.Sequential(

            # 1st CNN block
            nn.Conv2d(3, 16, kernel_size=2, stride=1, padding="same"),
            nn.BatchNorm2d(16),
            nn.ReLU(True),
            nn.MaxPool2d(kernel_size=2, stride=2),

            # 2nd CNN block
            nn.Conv2d(16, 32, kernel_size=2, stride=1, padding="same"),
            nn.BatchNorm2d(32),
            nn.ReLU(True),
            nn.MaxPool2d(kernel_size=2, stride=2),

            # 3rd CNN block
            nn.Conv2d(32, 64, kernel_size=2, stride=1, padding="same"),
            nn.BatchNorm2d(64),
            nn.ReLU(True),
            nn.MaxPool2d(kernel_size=2, stride=2),

            # flatten
            nn.Flatten(),

            # FC layers
            nn.Linear(1024, 256),
            nn.ReLU(True),

            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        return self.model(x)

'''
    Define model architectures for object detection using FasterRCNN
'''
class FasterRCNNDetection_V1(nn.Module):
    def __init__(
        self,
        num_classes=2,
        min_size=1024,
        max_size=1024,
        score_thresh=0.05,
        nms_thresh=0.5,
        isTransform=False
    ):
        super().__init__()
        self.isTransform = isTransform

        # backbone
        backbone = resnet_fpn_backbone(
            backbone_name="resnet50",
            weights="DEFAULT",
        )

        # anchor generator
        anchor_generator = AnchorGenerator(
            sizes=((8,), (16,), (32,), (64,), (128,)), # traffic signs are small objects, so we use smaller anchor sizes
            aspect_ratios=((0.5, 1.0, 2.0),) * 5
        )

        # FasterRCNN model
        self.model = FasterRCNN(
            backbone=backbone,
            num_classes=num_classes,
            rpn_anchor_generator=anchor_generator,
            min_size=min_size,
            max_size=max_size
        )

        # thresholds
        self.model.roi_heads.score_thresh = score_thresh
        self.model.roi_heads.nms_thresh = nms_thresh

        # transforms
        if self.isTransform:
            self.eva_transforms = transforms.Compose([
                transforms.ColorJitter(
                    brightness=0.2,
                    contrast=0.2,
                    saturation=0.2
                ),
                transforms.GaussianBlur(
                    kernel_size=3,
                    sigma=(0.1, 1.0)
                ),
                transforms.ToTensor()
            ])
        else:
            self.eva_transforms = transforms.Compose([
                transforms.ToTensor()
            ])

    def forward(self, images, targets=None):
        return self.model(images, targets)

    def transform_image(self, image):
        return self.eva_transforms(image)