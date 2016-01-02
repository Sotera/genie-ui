FROM python:2.7.11

RUN pip install --no-cache-dir elasticsearch==2.1.0
RUN pip install --no-cache-dir kafka-python==0.9.4

COPY realtimegeo.py .
COPY mapping.json .

ENTRYPOINT ["python2", "realtimegeo.py"]

# overridable defaults: docker run <image> -es_index myindex
# CMD ["-es", "http://localhost:9200", "-es_index", "instagram"]
