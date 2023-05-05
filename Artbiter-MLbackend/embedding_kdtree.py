from sklearn.decomposition import IncrementalPCA
from sklearn.neighbors import KDTree
import os
import numpy as np
import pickle
import math
from PIL import Image

# ipca = pickle.load(open('PCA_model.pkl', 'rb'))
# embeddings = np.load('final_embedding.npy')
artlist = pickle.load(open('Abstract_Expressionism_embed_2000.pickle', 'rb'))
embeddings = np.load('Abstract_Expressionism_intermediate_embeddings2000.npy')
file_directory = 'Abstract_Expressionism'
# pf= pickle.load(open(file_directory+'_embed_2000.pickle', 'rb'))
# embeddings = pf['embeddings']

# artlist = pf['filenames']
print(embeddings.shape, len(artlist))
print(embeddings)

tree = KDTree(embeddings, leaf_size=30)

search_idx = 90

dist, ind = tree.query(embeddings[search_idx:search_idx+1], k=5)
# print(dist, ind.squeeze())

for idx in ind.squeeze():
    print(artlist[idx])
    image = Image.open(os.path.join('../Data/wikiart/'+file_directory ,artlist[idx]))
    image.show()
# print(embeddings[:1])
# print(embeddings[1:2].shape)