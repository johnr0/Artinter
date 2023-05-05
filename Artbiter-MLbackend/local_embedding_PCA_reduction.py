from sklearn.decomposition import IncrementalPCA
import os
import numpy as np
import pickle
import math

compact_dim = 300

# ipca = IncrementalPCA(n_components = compact_dim)

# ipca = pickle.load(open('PCA_model.pkl', 'rb'))

# fit
Full_EM_PATH = './full_embeddings'
EM_PATH = './pca_embeddings'


# transform
piled_artnames = []
# piled = np.zeros((0, compact_dim))
filenames = os.listdir(Full_EM_PATH)
filenames.sort()
for filename in filenames:
    print(filename)
    # if filename.endswith('.npy'):
        # cur_data = np.load(os.path.join(Full_EM_PATH, filename))
        # piled = np.append(piled, ipca.transform(cur_data), axis=0)
    if filename.endswith('.pickle'):
        artnames = pickle.load(open(os.path.join(Full_EM_PATH, filename), 'rb'))
        artnames = [ filename.split('_embed')[0]+'/'+a for a in artnames]
        piled_artnames = piled_artnames + artnames

# with open('final_embedding.npy', 'wb') as fp:
#     np.save(fp, piled)

with open('final_artlist.pkl', 'wb') as fp:
    pickle.dump(piled_artnames, fp)

# print(len(piled_artnames), piled.shape)

