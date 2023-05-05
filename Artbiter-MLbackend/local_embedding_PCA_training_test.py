from sklearn.decomposition import IncrementalPCA
import os
import numpy as np
import pickle
import math

compact_dim = 300

ipca = IncrementalPCA(n_components = compact_dim)

# ipca = pickle.load(open('PCA_model_Post_Impressionism_intermediate_embeddings_1_.pkl', 'rb'))

# # fit

# skip_list = [
#     'Abstract_Expressionism_intermediate_embeddings.npy',
#     'Action_painting_intermediate_embeddings.npy',
#     'Analytical_Cubism_intermediate_embeddings.npy',
#     'Art_Nouveau_Modern_intermediate_embeddings.npy',
#     'Baroque_intermediate_embeddings.npy',
#     'Color_Field_Painting_intermediate_embeddings.npy',
#     'Contemporary_Realism_intermediate_embeddings.npy',
#     'Cubism_intermediate_embeddings.npy',
#     'Early_Renaissance_intermediate_embeddings.npy',
#     'Expressionism_intermediate_embeddings.npy',
#     'Fauvism_intermediate_embeddings.npy',
#     'High_Renaissance_intermediate_embeddings.npy',
#     'Impressionism_intermediate_embeddings_0.npy',
#     'Impressionism_intermediate_embeddings_1.npy',
#     'Impressionism_intermediate_embeddings_2.npy',
#     'Mannerism_Late_Renaissance_intermediate_embeddings.npy',
#     'Minimalism_intermediate_embeddings.npy',
#     'Naive_Art_Primitivism_intermediate_embeddings.npy',
#     'New_Realism_intermediate_embeddings.npy',
#     'Northern_Renaissance_intermediate_embeddings.npy',
#     'Pointillism_intermediate_embeddings.npy',
#     'Pop_Art_intermediate_embeddings.npy',
#     'Post_Impressionism_intermediate_embeddings_0.npy',
#     'Post_Impressionism_intermediate_embeddings_1.npy'




# ]

Full_EM_PATH = './full_embeddings'
EM_PATH = './pca_embeddings'


l = os.listdir(Full_EM_PATH)
l.sort()
cur_data = None
filename='Pop_Art_intermediate_embeddings1483.npy'


if filename.endswith('.npy'):
    if cur_data is None:
        cur_data = np.load(os.path.join(Full_EM_PATH, filename))
        print(filename, cur_data.shape[0])
    else:
        loaded = np.load(os.path.join(Full_EM_PATH, filename))
        print(filename, loaded.shape[0])
        cur_data = np.append(cur_data, loaded, axis=0)
    
    if cur_data.shape[0]>=350:
        for i in range(math.ceil(cur_data.shape[0]/350)-1):
            # print(i)
                if i==math.ceil(cur_data.shape[0]/350)-2:
                    print(i, cur_data.shape[0]-i*350)
                    ipca.partial_fit(cur_data[i*350:])
                else:
                    print(i, 350)
                    ipca.partial_fit(cur_data[i*350:(i+1)*350])

        with open('PCA_model_'+filename.split('.')[0]+'_.pkl', 'wb') as f:
            pickle.dump(ipca, f)
        cur_data = None
        

# save
# with open('PCA_model.pkl', 'wb') as f:
#     pickle.dump(ipca, f)

# transform
# piled_artnames = []
# piled = np.zeros((0, compact_dim))
# for filename in os.listdir(Full_EM_PATH):
#     print(filename)
#     if filename.endswith('.npy'):
#         cur_data = np.load(os.path.join(Full_EM_PATH, filename))
#         piled = np.append(piled, ipca.transform(cur_data), axis=0)
#     elif filename.endswith('.pkl'):
#         artnames = pickle.load(open(os.path.join(Full_EM_PATH, filename), 'rb'))
#         piled_artnames = piled_artnames + artnames

# with open('final_embedding.npy', 'wb') as fp:
#     np.save(fp, piled)

# with open('final_artlist.pkl', 'wb') as fp:
#     pickle.dump(piled_artnames, fp)

# print(len(piled_artnames), piled.shape)

