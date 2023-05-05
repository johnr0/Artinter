from flask import request, url_for
from flask_api import FlaskAPI, status, exceptions

from sklearn.decomposition import IncrementalPCA
from sklearn.neighbors import KDTree
import os
import numpy as np
import pickle
import math
from PIL import Image
import matplotlib.pyplot as plt
import re
import base64
from io import BytesIO
import json
import torch

from cav import *

from SANet import SA_vgg, decoder, Transform, test_transform
from torchvision.utils import save_image
from torchvision import transforms
import torch.nn as nn

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
SA_decoder = decoder
SA_transform = Transform(in_planes = 512)
SA_vgg = SA_vgg

SA_decoder.eval()
SA_transform.eval()
SA_vgg.eval()

SA_decoder.load_state_dict(torch.load('SANet_decoder_iter_500000.pth'))
SA_transform.load_state_dict(torch.load('SANet_transformer_iter_500000.pth'))
SA_vgg.load_state_dict(torch.load('SANet_vgg_normalised.pth'))

norm = nn.Sequential(*list(SA_vgg.children())[:1])
enc_1 = nn.Sequential(*list(SA_vgg.children())[:4])  # input -> relu1_1
enc_2 = nn.Sequential(*list(SA_vgg.children())[4:11])  # relu1_1 -> relu2_1
enc_3 = nn.Sequential(*list(SA_vgg.children())[11:18])  # relu2_1 -> relu3_1
enc_4 = nn.Sequential(*list(SA_vgg.children())[18:31])  # relu3_1 -> relu4_1
enc_5 = nn.Sequential(*list(SA_vgg.children())[31:44])  # relu4_1 -> relu5_1

norm.to(device)
enc_1.to(device)
enc_2.to(device)
enc_3.to(device)
enc_4.to(device)
enc_5.to(device)
SA_decoder.to(device)
SA_transform.to(device)

# print(os.listdir('full_embeddings'))
npy_list = [name for name in os.listdir('../../Data/wikiart')]
random_sampled = np.random.choice(npy_list, 20, replace=False)
print(random_sampled)

all_arrays = None

for name in random_sampled:
    im_list = [im_name for im_name in os.listdir('../../Data/wikiart/'+name) if im_name.endswith('.jpg')]
    im_sampled = np.random.choice(im_list, 1, replace=False)

    im_path = '../../Data/wikiart/'+name+'/'+im_sampled[0]
    

    img = Image.open(im_path)
    img = img.resize((224, 224))

    style_tf = test_transform()
    style = style_tf(img)
    style = style.to(device).unsqueeze(0)
    with torch.no_grad():
        Style4_1 = enc_4(enc_3(enc_2(enc_1(style))))
        Style5_1 = enc_5(Style4_1)
    Style4_1=Style4_1.numpy().flatten()
    Style4_1 = np.reshape(Style4_1, (1, Style4_1.shape[0]))
    Style5_1=Style5_1.numpy().flatten()
    Style5_1 = np.reshape(Style5_1, (1, Style5_1.shape[0]))
    print(Style4_1.shape)
    img_arr = np.concatenate((Style4_1, Style5_1), axis=1)

    if all_arrays is None:
        all_arrays = img_arr
    else:
        all_arrays = np.concatenate((all_arrays, img_arr), axis=0)
    print(all_arrays.shape)
with open('sampled_long_embedding.npy', 'wb') as f:  
    np.save(f, all_arrays)


    # break
print(all_arrays.shape)