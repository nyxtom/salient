# salient.io
salient.io is an artificial intelligence, computer vision, machine learning and natural language processing toolkit. Salient uses many of the broad machine learning concepts to perform various tasks such as: regression analysis, classification, clustering/segmentation, dimensionality reduction, collaborative filtering, feature analysis and more.

### Goals
The goals of salient can be broken down into several categories of machine learning exercises. These are divided up by the type of task processed as well as providing a means for error correction and learning accuracy checks. 

1. Multivariate Linear Regression Analysis
2. Multivariate Logistic Regression
3. Neural Networks
4. Convolutional Neural Networks
4. Singular Value Decomposition
5. Support Vector Machines
6. k-means, sequential k-means
7. Principal Component Analysis
8. Sparse Autoencoders (or Nonlinear Principal Component Analysis)
9. Manifold Learning
10. Cross Validation
11. F-Score, Precision/Recall, True-Negative/True-Positive/False-Negative/False-Positive
12. Learning Curves, Validation Curves
13. Gaussian Kernels, chi-square kernel, polynomial kernel
14. Semantic Word Vectors
15. Multivariate and Univariate Gaussian Distribution Analysis
16. Multivariate and Univariate Skew-Normal Distribution Analysis
17. Collaborative Filtering
18. Min-batch and Stochastic Gradient Descent
19. Stochastic Gradient Boosting Trees
20. Mean-normalization

### Applications
Finally, given the above machine learning tools, we can derive further goals for salient that allow us to perform tasks related to the following types of application examples:

1. Personalized Recommendation Systems
2. Anomaly and Event Detection
3. Feature Learning
4. Single and Multi-class Classification
5. Unsupervised Learning and Cluster Analysis
6. Categorization and Segmentation
7. Computer Vision, Face Recognition, Object Detection
8. Computer Vision for Text Recognition
9. Brand Analysis within Computer Vision
10. Sentiment Analysis
11. Trend Analysis
12. Dimensionality Reduction
13. Image Compression
14. Question-Answering

This list can be expanded to a wide variety of use cases given that our toolkit provides a great starting ground for many of the well-known and popular machine learning techniques and algorithms. Test cases and usage can be found by looking within the *specs/* directory.

### Notes

It should be noted that most machine learning algorithms would be better suited in environments that can take advantage of many cores, such as in the case of GPU accelerated machine learning. Such things are necessary in order to speed up the learning rate as well as the task at hand given that many complex linear algebra operations can be done efficiently in parallel. As a result, this project is more of an example test case implementation for a wide-variety of machine learning and artificial intelligence problems. For more robust implementations, it is recommended that you glean from my implementations and others (i.e. by reference to Andrew Ng's Machine Learning course) and use that within the scope of your projects. However, there are other techniques such as map-reduce that may be able to improve the performance of running some of these operations within this package on multiple cores and multiple systems in parallel.

### License

MIT License

