from PIL import Image


# preprocessing_image(image, 224, 224)
def preprocessing_image(image, output_height, output_width, resize_side):
    
    # RESIZING
    image = _aspect_preserving_resize(image, resize_side)

    # CROPPING
    image = _central_crop([image], output_height, output_width)[0]

    # RESHAPING
    # image.set_shape([output_height, output_width, 3])
    return image

def _aspect_preserving_resize(image, smallest_side):
    height = image.height
    width = image.width
    new_height, new_width = _smallest_size_at_least(height, width, smallest_side)
    resized_image = image.resize((new_width, new_height))

    # image = tf.expand_dims(image, 0)
    # resized_image = tf.image.resize_bilinear(image, [new_height, new_width],
    #                                          align_corners=False)
    # resized_image = tf.squeeze(resized_image)
    # resized_image.set_shape([None, None, 3])
    return resized_image

def _smallest_size_at_least(height, width, smallest_side):

    if height>width:
        scale = smallest_side / width
    else:
        scale = smallest_side / height

    new_height = int(height * scale)
    new_width = int(width * scale)
    return new_height, new_width


def _central_crop(image_list, crop_height, crop_width):
    outputs = []
    for image in image_list:
        image_height = image.height
        image_width = image.width

        offset_height = (image_height - crop_height) / 2
        offset_width = (image_width - crop_width) / 2

        outputs.append(image.crop((offset_width, offset_height, offset_width+crop_width, offset_height+crop_height)))
    return outputs

def central_crop(image_list, crop_height, crop_width):
    outputs = []
    for image in image_list:
        image_height = image.height
        image_width = image.width

        offset_height = int((image_height - crop_height) / 2)
        offset_width = int((image_width - crop_width) / 2)

        outputs.append(image.crop((offset_width, offset_height, offset_width+crop_width, offset_height+crop_height)))
    return outputs